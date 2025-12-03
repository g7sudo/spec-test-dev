using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Files.Commands.UploadPermanentFile;

/// <summary>
/// Handler for uploading files directly to permanent storage.
/// </summary>
public class UploadPermanentFileCommandHandler : IRequestHandler<UploadPermanentFileCommand, Result<DocumentDto>>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUser _currentUser;
    private readonly IConfiguration _configuration;

    public UploadPermanentFileCommandHandler(
        IFileStorageService fileStorageService,
        ITenantDbContext dbContext,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        IConfiguration configuration)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _currentUser = currentUser;
        _configuration = configuration;
    }

    public async Task<Result<DocumentDto>> Handle(UploadPermanentFileCommand request, CancellationToken cancellationToken)
    {
        // Validate tenant context
        if (!_tenantContext.TenantId.HasValue)
        {
            return Result<DocumentDto>.Failure("Tenant context not available.");
        }

        var tenantId = _tenantContext.TenantId.Value;
        var file = request.File;

        // Validate file size
        var maxSizeBytes = _configuration.GetValue<long>("FileUpload:MaxFileSizeBytes", 10485760);
        if (file.Length > maxSizeBytes)
        {
            return Result<DocumentDto>.Failure($"File size exceeds maximum allowed size of {maxSizeBytes / 1024 / 1024}MB.");
        }

        // Validate content type
        var allowedTypes = _configuration.GetSection("FileUpload:AllowedImageTypes").Get<string[]>()
            ?? new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };

        if (!allowedTypes.Contains(file.ContentType))
        {
            return Result<DocumentDto>.Failure($"File type '{file.ContentType}' is not allowed.");
        }

        // Validate owner entity exists
        var ownerExists = await ValidateOwnerExists(request.OwnerType, request.OwnerId, cancellationToken);
        if (!ownerExists)
        {
            return Result<DocumentDto>.Failure($"{request.OwnerType} with ID '{request.OwnerId}' not found.");
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<DocumentDto>.Failure("User does not exist in the current tenant. Contact your administrator.");
        }

        try
        {
            // Upload to blob storage
            await using var stream = file.OpenReadStream();
            var blobPath = await _fileStorageService.UploadPermanentFileAsync(
                tenantId,
                request.OwnerType.ToString(),
                request.OwnerId,
                file.FileName,
                stream,
                file.ContentType,
                cancellationToken);

            // Create document entity
            var document = Document.Create(
                request.OwnerType,
                request.OwnerId,
                request.Category,
                file.FileName,
                blobPath,
                file.ContentType,
                file.Length,
                _currentUser.TenantUserId.Value,
                description: request.Description);

            _dbContext.Add(document);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Generate download URL
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(blobPath, cancellationToken: cancellationToken);

            // Return DTO
            var dto = new DocumentDto
            {
                Id = document.Id,
                FileName = document.FileName,
                ContentType = document.ContentType,
                SizeBytes = document.SizeBytes,
                DownloadUrl = downloadUrl,
                Category = document.Category.ToString(),
                DisplayOrder = document.DisplayOrder,
                CreatedAt = document.CreatedAt
            };

            return Result<DocumentDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<DocumentDto>.Failure($"Failed to upload file: {ex.Message}");
        }
    }

    private async Task<bool> ValidateOwnerExists(DocumentOwnerType ownerType, Guid ownerId, CancellationToken cancellationToken)
    {
        return ownerType switch
        {
            DocumentOwnerType.Unit => await _dbContext.Units.AnyAsync(x => x.Id == ownerId && x.IsActive, cancellationToken),
            DocumentOwnerType.Block => await _dbContext.Blocks.AnyAsync(x => x.Id == ownerId && x.IsActive, cancellationToken),
            DocumentOwnerType.Floor => await _dbContext.Floors.AnyAsync(x => x.Id == ownerId && x.IsActive, cancellationToken),
            DocumentOwnerType.ParkingSlot => await _dbContext.ParkingSlots.AnyAsync(x => x.Id == ownerId && x.IsActive, cancellationToken),
            DocumentOwnerType.CommunityUser => await _dbContext.CommunityUsers.AnyAsync(x => x.Id == ownerId && x.IsActive, cancellationToken),
            _ => false
        };
    }
}
