using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyProfile;

/// <summary>
/// Handler for updating the current user's display profile settings.
/// </summary>
public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, Result<MediatR.Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyProfileCommandHandler> _logger;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public UpdateMyProfileCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyProfileCommandHandler> logger,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<MediatR.Unit>> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("UpdateMyProfile called without tenant context");
            return Result<MediatR.Unit>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Updating profile for community user {CommunityUserId}", tenantUserId);

        // Get or create profile
        var profile = await _dbContext.CommunityUserProfiles
            .FirstOrDefaultAsync(p => p.CommunityUserId == tenantUserId && p.IsActive, cancellationToken);

        if (profile == null)
        {
            // Create profile if it doesn't exist
            profile = CommunityUserProfile.Create(
                communityUserId: tenantUserId.Value,
                displayName: request.DisplayName,
                createdBy: tenantUserId);

            _dbContext.Add(profile);
        }

        Guid? profilePhotoDocumentId = request.ProfilePhotoDocumentId;

        // Handle temp profile photo upload
        if (!string.IsNullOrWhiteSpace(request.TempProfilePhoto))
        {
            var tenantId = _tenantContext.TenantId;
            if (!tenantId.HasValue)
            {
                return Result<MediatR.Unit>.Failure("Tenant context not available.");
            }

            _logger.LogInformation("Processing temp profile photo for community user {CommunityUserId}", tenantUserId);

            // Fetch temp file
            var tempFile = await _dbContext.TempFileUploads
                .FirstOrDefaultAsync(x => x.TempKey == request.TempProfilePhoto && x.IsActive, cancellationToken);

            if (tempFile == null)
            {
                return Result<MediatR.Unit>.Failure($"Temporary file not found for key: {request.TempProfilePhoto}");
            }

            // Validate ownership
            if (tempFile.UploadedByUserId != tenantUserId.Value)
            {
                return Result<MediatR.Unit>.Failure("You can only attach files uploaded by yourself.");
            }

            if (tempFile.TenantId != tenantId.Value)
            {
                return Result<MediatR.Unit>.Failure("File does not belong to the current tenant.");
            }

            // Start transaction for profile update + file move
            await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
            try
            {
                // Build destination path: tenant-{TenantId}/users/{CommunityUserId}/{FileName}
                var destinationPath = $"tenant-{tenantId.Value}/users/{tenantUserId.Value}/{tempFile.FileName}";

                // Move file to permanent storage
                await _fileStorageService.MoveToPermanentAsync(
                    tempFile.BlobPath,
                    destinationPath,
                    cancellationToken);

                // Create document entity
                var document = Document.Create(
                    ownerType: DocumentOwnerType.CommunityUser,
                    ownerId: tenantUserId.Value,
                    category: DocumentCategory.Image,
                    fileName: tempFile.FileName,
                    blobPath: destinationPath,
                    contentType: tempFile.ContentType,
                    sizeBytes: tempFile.SizeBytes,
                    createdBy: tenantUserId.Value,
                    title: "Profile Photo",
                    description: null,
                    displayOrder: 0
                );
                _dbContext.Add(document);

                // Soft-delete temp file
                tempFile.Deactivate(tenantUserId.Value);

                await _dbContext.SaveChangesAsync(cancellationToken);

                // Use the new document ID
                profilePhotoDocumentId = document.Id;

                _logger.LogInformation("Profile photo uploaded successfully for community user {CommunityUserId}, DocumentId: {DocumentId}",
                    tenantUserId, document.Id);

                await transaction.CommitAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to upload profile photo for community user {CommunityUserId}", tenantUserId);
                return Result<MediatR.Unit>.Failure($"Failed to upload profile photo: {ex.Message}");
            }
        }

        // Update display settings
        profile.UpdateDisplaySettings(
            displayName: request.DisplayName,
            aboutMe: request.AboutMe,
            profilePhotoDocumentId: profilePhotoDocumentId,
            updatedBy: tenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Profile updated successfully for community user {CommunityUserId}", tenantUserId);

        return Result<MediatR.Unit>.Success(MediatR.Unit.Value);
    }
}

