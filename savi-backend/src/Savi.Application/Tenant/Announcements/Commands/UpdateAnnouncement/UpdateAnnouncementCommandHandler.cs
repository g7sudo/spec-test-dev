using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.UpdateAnnouncement;

/// <summary>
/// Handler for updating an existing announcement.
/// </summary>
public class UpdateAnnouncementCommandHandler : IRequestHandler<UpdateAnnouncementCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public UpdateAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        IFileStorageService fileStorageService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _fileStorageService = fileStorageService;
        _tenantContext = tenantContext;
    }

    public async Task<Result> Handle(
        UpdateAnnouncementCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        // Find the announcement
        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (announcement == null)
        {
            return Result.Failure("Announcement not found.");
        }

        // Only allow editing Draft or Scheduled announcements (or minor edits on Published)
        if (announcement.Status == AnnouncementStatus.Archived)
        {
            return Result.Failure("Cannot edit archived announcements.");
        }

        // Validate audiences
        foreach (var audience in request.Audiences)
        {
            var validationResult = await ValidateAudienceAsync(audience, cancellationToken);
            if (validationResult.IsFailure)
            {
                return Result.Failure(validationResult.Error ?? "Audience validation failed.");
            }
        }

        // Validate temp documents if provided
        List<TempFileUpload>? tempFiles = null;
        if (request.TempDocuments != null && request.TempDocuments.Count > 0)
        {
            var tenantId = _tenantContext.TenantId;
            if (!tenantId.HasValue)
            {
                return Result.Failure("Tenant context not available.");
            }

            tempFiles = await _dbContext.TempFileUploads
                .Where(x => request.TempDocuments.Contains(x.TempKey) && x.IsActive)
                .ToListAsync(cancellationToken);

            if (tempFiles.Count == 0)
            {
                return Result.Failure(
                    $"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
            }

            // Validate all files belong to current user
            var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != userId).ToList();
            if (filesNotOwnedByUser.Any())
            {
                return Result.Failure("You can only attach files uploaded by yourself.");
            }

            // Validate all files belong to current tenant
            var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
            if (filesNotInTenant.Any())
            {
                return Result.Failure("Some files do not belong to the current tenant.");
            }
        }

        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update the announcement
            announcement.Update(
                request.Title,
                request.Body,
                request.Category,
                request.Priority,
                request.IsPinned,
                request.IsBanner,
                request.AllowLikes,
                request.AllowComments,
                request.AllowAddToCalendar,
                request.IsEvent,
                request.EventStartAt,
                request.EventEndAt,
                request.IsAllDay,
                request.EventLocationText,
                request.EventJoinUrl,
                userId);

            // Remove existing audiences and add new ones
            var existingAudiences = await _dbContext.AnnouncementAudiences
                .Where(a => a.AnnouncementId == request.Id && a.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var audience in existingAudiences)
            {
                audience.Deactivate(userId);
            }

            foreach (var audienceInput in request.Audiences)
            {
                var audience = CreateAudienceEntity(announcement.Id, audienceInput, userId);
                _dbContext.Add(audience);
            }

            // Remove specified documents
            if (request.DocumentsToRemove != null && request.DocumentsToRemove.Count > 0)
            {
                var documentsToRemove = await _dbContext.Documents
                    .Where(d => request.DocumentsToRemove.Contains(d.Id) &&
                               d.OwnerType == DocumentOwnerType.Announcement &&
                               d.OwnerId == request.Id &&
                               d.IsActive)
                    .ToListAsync(cancellationToken);

                foreach (var doc in documentsToRemove)
                {
                    doc.Deactivate(userId);
                }
            }

            // Add new documents from temp files
            if (tempFiles != null && tempFiles.Count > 0)
            {
                var tenantId = _tenantContext.TenantId!.Value;

                // Get current max display order
                var maxDisplayOrder = await _dbContext.Documents
                    .Where(d => d.OwnerType == DocumentOwnerType.Announcement &&
                               d.OwnerId == request.Id &&
                               d.IsActive)
                    .MaxAsync(d => (int?)d.DisplayOrder, cancellationToken) ?? -1;

                var displayOrder = maxDisplayOrder + 1;

                foreach (var tempFile in tempFiles)
                {
                    // Build destination path: tenant-{TenantId}/announcements/{AnnouncementId}/{FileName}
                    var destinationPath = $"tenant-{tenantId}/announcements/{announcement.Id}/{tempFile.FileName}";

                    // Move file from temp to permanent storage
                    await _fileStorageService.MoveToPermanentAsync(
                        tempFile.BlobPath,
                        destinationPath,
                        cancellationToken);

                    // Create document entity
                    var document = Document.Create(
                        ownerType: DocumentOwnerType.Announcement,
                        ownerId: announcement.Id,
                        category: DocumentCategory.Image,
                        fileName: tempFile.FileName,
                        blobPath: destinationPath,
                        contentType: tempFile.ContentType,
                        sizeBytes: tempFile.SizeBytes,
                        createdBy: userId,
                        title: null,
                        description: null,
                        displayOrder: displayOrder++
                    );
                    _dbContext.Add(document);

                    // Soft-delete temp file record
                    tempFile.Deactivate(userId);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure($"Failed to update announcement: {ex.Message}");
        }
    }

    private async Task<Result> ValidateAudienceAsync(
        CreateAnnouncementAudienceInput audience,
        CancellationToken cancellationToken)
    {
        switch (audience.TargetType)
        {
            case AudienceTargetType.Block:
                if (!audience.BlockId.HasValue)
                {
                    return Result.Failure("Block ID is required for Block target type.");
                }
                var blockExists = await _dbContext.Blocks
                    .AsNoTracking()
                    .AnyAsync(b => b.Id == audience.BlockId.Value && b.IsActive, cancellationToken);
                if (!blockExists)
                {
                    return Result.Failure($"Block with ID {audience.BlockId.Value} not found.");
                }
                break;

            case AudienceTargetType.Unit:
                if (!audience.UnitId.HasValue)
                {
                    return Result.Failure("Unit ID is required for Unit target type.");
                }
                var unitExists = await _dbContext.Units
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == audience.UnitId.Value && u.IsActive, cancellationToken);
                if (!unitExists)
                {
                    return Result.Failure($"Unit with ID {audience.UnitId.Value} not found.");
                }
                break;

            case AudienceTargetType.RoleGroup:
                if (!audience.RoleGroupId.HasValue)
                {
                    return Result.Failure("Role Group ID is required for RoleGroup target type.");
                }
                var roleGroupExists = await _dbContext.RoleGroups
                    .AsNoTracking()
                    .AnyAsync(r => r.Id == audience.RoleGroupId.Value && r.IsActive, cancellationToken);
                if (!roleGroupExists)
                {
                    return Result.Failure($"Role Group with ID {audience.RoleGroupId.Value} not found.");
                }
                break;
        }

        return Result.Success();
    }

    private static AnnouncementAudience CreateAudienceEntity(
        Guid announcementId,
        CreateAnnouncementAudienceInput input,
        Guid createdBy)
    {
        return input.TargetType switch
        {
            AudienceTargetType.Community => AnnouncementAudience.ForCommunity(announcementId, createdBy),
            AudienceTargetType.Block => AnnouncementAudience.ForBlock(announcementId, input.BlockId!.Value, createdBy),
            AudienceTargetType.Unit => AnnouncementAudience.ForUnit(announcementId, input.UnitId!.Value, createdBy),
            AudienceTargetType.RoleGroup => AnnouncementAudience.ForRoleGroup(announcementId, input.RoleGroupId!.Value, createdBy),
            _ => throw new ArgumentException($"Unknown target type: {input.TargetType}")
        };
    }
}
