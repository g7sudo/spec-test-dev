using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Files.Dtos;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Files.Commands.CleanupExpiredTempFiles;

/// <summary>
/// Handler for cleaning up expired temporary files.
/// </summary>
public class CleanupExpiredTempFilesCommandHandler : IRequestHandler<CleanupExpiredTempFilesCommand, Result<CleanupResultDto>>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUser _currentUser;

    public CleanupExpiredTempFilesCommandHandler(
        IFileStorageService fileStorageService,
        ITenantDbContext dbContext,
        ITenantContext tenantContext,
        ICurrentUser currentUser)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _currentUser = currentUser;
    }

    public async Task<Result<CleanupResultDto>> Handle(CleanupExpiredTempFilesCommand request, CancellationToken cancellationToken)
    {
        // Validate tenant context
        if (!_tenantContext.TenantId.HasValue)
        {
            return Result<CleanupResultDto>.Failure("Tenant context not available.");
        }

        var tenantId = _tenantContext.TenantId.Value;
        var cutoffDate = DateTime.UtcNow.AddDays(-request.DaysOld);

        try
        {
            // Find expired temp files in database
            var expiredFiles = await _dbContext.TempFileUploads
                .Where(x => x.TenantId == tenantId
                            && x.IsActive
                            && x.CreatedAt < cutoffDate)
                .ToListAsync(cancellationToken);

            var deletedCount = 0;

            // Delete each file from blob storage and soft-delete database record
            foreach (var tempFile in expiredFiles)
            {
                try
                {
                    // Delete blob
                    await _fileStorageService.DeleteFileAsync(tempFile.BlobPath, cancellationToken);

                    // Soft-delete database record
                    tempFile.Deactivate();
                    tempFile.MarkAsUpdated(_currentUser.UserId);

                    deletedCount++;
                }
                catch
                {
                    // Continue with other files even if one fails
                    // Log would be helpful here but we'll just skip for now
                }
            }

            // Save all changes
            if (deletedCount > 0)
            {
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            // Also cleanup blobs that might not be in database (orphaned blobs)
            var blobsDeleted = await _fileStorageService.DeleteExpiredTempFilesAsync(
                tenantId,
                request.DaysOld,
                cancellationToken);

            var totalDeleted = Math.Max(deletedCount, blobsDeleted);

            var dto = new CleanupResultDto
            {
                DeletedCount = totalDeleted,
                TenantId = tenantId
            };

            return Result<CleanupResultDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<CleanupResultDto>.Failure($"Failed to cleanup expired temp files: {ex.Message}");
        }
    }
}
