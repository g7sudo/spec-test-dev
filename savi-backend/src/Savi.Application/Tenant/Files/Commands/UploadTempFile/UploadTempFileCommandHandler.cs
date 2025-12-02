using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Files.Commands.UploadTempFile;

/// <summary>
/// Handler for uploading files to temporary storage.
/// </summary>
public class UploadTempFileCommandHandler : IRequestHandler<UploadTempFileCommand, Result<TempFileUploadDto>>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUser _currentUser;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UploadTempFileCommandHandler> _logger;

    public UploadTempFileCommandHandler(
        IFileStorageService fileStorageService,
        ITenantDbContext dbContext,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        IConfiguration configuration,
        ILogger<UploadTempFileCommandHandler> logger)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _currentUser = currentUser;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Result<TempFileUploadDto>> Handle(UploadTempFileCommand request, CancellationToken cancellationToken)
    {
        // Validate tenant context
        if (!_tenantContext.TenantId.HasValue)
        {
            return Result<TempFileUploadDto>.Failure("Tenant context not available.");
        }

        var tenantId = _tenantContext.TenantId.Value;
        var file = request.File;

        // Validate file size
        var maxSizeBytes = _configuration.GetValue<long>("FileUpload:MaxFileSizeBytes", 10485760); // 10MB default
        if (file.Length > maxSizeBytes)
        {
            return Result<TempFileUploadDto>.Failure($"File size exceeds maximum allowed size of {maxSizeBytes / 1024 / 1024}MB.");
        }

        // Validate content type
        var allowedTypes = _configuration.GetSection("FileUpload:AllowedImageTypes").Get<string[]>()
            ?? new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };

        if (!allowedTypes.Contains(file.ContentType))
        {
            return Result<TempFileUploadDto>.Failure($"File type '{file.ContentType}' is not allowed. Allowed types: {string.Join(", ", allowedTypes)}");
        }

        try
        {
            _logger.LogInformation("Starting temp file upload for tenant {TenantId}, file: {FileName}", tenantId, file.FileName);

            // Validate tenant user exists
            if (!_currentUser.TenantUserId.HasValue)
            {
                return Result<TempFileUploadDto>.Failure("User does not exist in the current tenant. Contact your administrator.");
            }

            // Upload to blob storage
            await using var stream = file.OpenReadStream();
            var blobPath = await _fileStorageService.UploadTempFileAsync(
                tenantId,
                request.TempKey,
                file.FileName,
                stream,
                file.ContentType,
                cancellationToken);

            _logger.LogInformation("Blob uploaded successfully: {BlobPath}", blobPath);

            // Create database record
            var expiryDays = _configuration.GetValue<int>("FileUpload:TempFileExpiryDays", 7);
            var tempFileUpload = TempFileUpload.Create(
                tenantId,
                request.TempKey,
                _currentUser.TenantUserId.Value,
                blobPath,
                file.FileName,
                file.ContentType,
                file.Length,
                expiryDays);

            _logger.LogInformation("Created TempFileUpload entity with ID: {Id}, UploadedByUserId: {UserId}",
                tempFileUpload.Id, _currentUser.TenantUserId.Value);

            _dbContext.Add(tempFileUpload);

            _logger.LogInformation("Calling SaveChangesAsync to save TempFileUpload to database...");
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("SaveChangesAsync completed successfully");

            // Return DTO
            var dto = new TempFileUploadDto
            {
                Id = tempFileUpload.Id,
                FileName = tempFileUpload.FileName,
                ContentType = tempFileUpload.ContentType,
                SizeBytes = tempFileUpload.SizeBytes,
                CreatedAt = tempFileUpload.CreatedAt
            };

            return Result<TempFileUploadDto>.Success(dto);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "DbUpdateException while saving TempFileUpload. " +
                "InnerException: {InnerException}. " +
                "Message: {Message}",
                dbEx.InnerException?.Message ?? "null",
                dbEx.Message);

            var errorMsg = $"Database error while saving temp file upload. " +
                          $"Error: {dbEx.InnerException?.Message ?? dbEx.Message}. " +
                          $"This usually means the TempFileUploads table doesn't exist. " +
                          $"Run the migration endpoint: POST /api/v1/platform/maintenance/migrate-tenant-databases";

            return Result<TempFileUploadDto>.Failure(errorMsg);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while uploading temp file. Type: {ExceptionType}, Message: {Message}",
                ex.GetType().Name, ex.Message);
            return Result<TempFileUploadDto>.Failure($"Failed to upload file: {ex.Message}");
        }
    }
}
