using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyProfilePhoto;

/// <summary>
/// Handler for updating the current user's profile photo from file stream.
/// </summary>
public class UpdateMyProfilePhotoCommandHandler : IRequestHandler<UpdateMyProfilePhotoCommand, Result<ProfilePhotoResultDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyProfilePhotoCommandHandler> _logger;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    private static readonly Dictionary<string, string> ContentTypeExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { "image/jpeg", ".jpg" },
        { "image/jpg", ".jpg" },
        { "image/png", ".png" },
        { "image/gif", ".gif" },
        { "image/webp", ".webp" }
    };

    public UpdateMyProfilePhotoCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyProfilePhotoCommandHandler> logger,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<ProfilePhotoResultDto>> Handle(UpdateMyProfilePhotoCommand request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("UpdateMyProfilePhoto called without tenant context");
            return Result<ProfilePhotoResultDto>.Failure("Tenant context not available.");
        }

        var tenantId = _tenantContext.TenantId;
        if (!tenantId.HasValue)
        {
            return Result<ProfilePhotoResultDto>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Updating profile photo for community user {CommunityUserId}", tenantUserId);

        // Validate file stream
        if (request.FileStream == null || request.FileStream.Length == 0)
        {
            return Result<ProfilePhotoResultDto>.Failure("No file provided.");
        }

        // Validate content type
        if (!AllowedContentTypes.Contains(request.ContentType))
        {
            return Result<ProfilePhotoResultDto>.Failure($"Invalid content type '{request.ContentType}'. Allowed types: {string.Join(", ", AllowedContentTypes)}");
        }

        // Validate size (max 10MB)
        const long maxSizeBytes = 10 * 1024 * 1024;
        var fileSize = request.FileSize > 0 ? request.FileSize : request.FileStream.Length;
        if (fileSize > maxSizeBytes)
        {
            return Result<ProfilePhotoResultDto>.Failure("Image size exceeds maximum allowed size of 10MB.");
        }

        // Determine file name with correct extension
        var extension = ContentTypeExtensions.GetValueOrDefault(request.ContentType, ".jpg");
        var fileName = !string.IsNullOrWhiteSpace(request.FileName)
            ? request.FileName
            : $"profile-photo-{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";

        // Ensure file name has correct extension
        if (!Path.HasExtension(fileName))
        {
            fileName += extension;
        }

        // Get or create profile
        var profile = await _dbContext.CommunityUserProfiles
            .FirstOrDefaultAsync(p => p.CommunityUserId == tenantUserId && p.IsActive, cancellationToken);

        if (profile == null)
        {
            profile = CommunityUserProfile.Create(
                communityUserId: tenantUserId.Value,
                displayName: null,
                createdBy: tenantUserId);

            _dbContext.Add(profile);
        }

        // Start transaction for profile update + file upload
        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Upload directly to permanent storage
            // UploadPermanentFileAsync returns the actual blob path (with sanitized filename and timestamp)
            // Path format: tenant-{TenantId}/communityuser/{CommunityUserId}/{SanitizedFileName}
            var blobPath = await _fileStorageService.UploadPermanentFileAsync(
                tenantId.Value,
                "CommunityUser", // This will be converted to lowercase: "communityuser"
                tenantUserId.Value,
                fileName,
                request.FileStream,
                request.ContentType,
                cancellationToken);

            _logger.LogInformation("File uploaded to blob path: {BlobPath}", blobPath);

            // Create document entity using the actual blob path returned from storage service
            var document = Document.Create(
                ownerType: DocumentOwnerType.CommunityUser,
                ownerId: tenantUserId.Value,
                category: DocumentCategory.Image,
                fileName: fileName, // Original filename (for display)
                blobPath: blobPath, // Actual blob path (with sanitized name and timestamp)
                contentType: request.ContentType,
                sizeBytes: fileSize,
                createdBy: tenantUserId.Value,
                title: "Profile Photo",
                description: null,
                displayOrder: 0
            );
            _dbContext.Add(document);

            // Update profile with new photo document ID
            profile.UpdateDisplaySettings(
                displayName: profile.DisplayName,
                aboutMe: profile.AboutMe,
                profilePhotoDocumentId: document.Id,
                updatedBy: tenantUserId);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // Generate download URL using the actual blob path
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                blobPath,
                expiresInMinutes: 60,
                cancellationToken);

            _logger.LogInformation(
                "Profile photo uploaded successfully for community user {CommunityUserId}, DocumentId: {DocumentId}",
                tenantUserId, document.Id);

            return Result<ProfilePhotoResultDto>.Success(new ProfilePhotoResultDto
            {
                DocumentId = document.Id,
                DownloadUrl = downloadUrl,
                FileName = fileName,
                ContentType = request.ContentType,
                SizeBytes = fileSize
            });
        }
        catch (Exception ex)
        {
            // Only rollback if transaction hasn't been committed or disposed
            try
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                }
            }
            catch (Exception rollbackEx)
            {
                // Log rollback error but don't throw - original exception is more important
                _logger.LogWarning(rollbackEx, "Error during transaction rollback (transaction may already be completed)");
            }
            
            _logger.LogError(ex, "Failed to upload profile photo for community user {CommunityUserId}", tenantUserId);
            return Result<ProfilePhotoResultDto>.Failure($"Failed to upload profile photo: {ex.Message}");
        }
    }
}
