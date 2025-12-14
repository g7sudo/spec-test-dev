using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;

/// <summary>
/// Handler for creating a new announcement.
/// </summary>
public class CreateAnnouncementCommandHandler : IRequestHandler<CreateAnnouncementCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITenantContext _tenantContext;

    public CreateAnnouncementCommandHandler(
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

    public async Task<Result<Guid>> Handle(
        CreateAnnouncementCommand request,
        CancellationToken cancellationToken)
    {
        // Validate current user exists in tenant
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var userId = _currentUser.TenantUserId.Value;

        // Validate audiences
        if (request.Audiences == null || request.Audiences.Count == 0)
        {
            return Result<Guid>.Failure("At least one audience target is required.");
        }

        // Validate audience targets exist
        foreach (var audience in request.Audiences)
        {
            var validationResult = await ValidateAudienceAsync(audience, cancellationToken);
            if (validationResult.IsFailure)
            {
                return Result<Guid>.Failure(validationResult.Error ?? "Audience validation failed.");
            }
        }

        // Validate temp documents if provided
        List<TempFileUpload>? tempFiles = null;
        if (request.TempDocuments != null && request.TempDocuments.Count > 0)
        {
            var tenantId = _tenantContext.TenantId;
            if (!tenantId.HasValue)
            {
                return Result<Guid>.Failure("Tenant context not available.");
            }

            tempFiles = await _dbContext.TempFileUploads
                .Where(x => request.TempDocuments.Contains(x.TempKey) && x.IsActive)
                .ToListAsync(cancellationToken);

            if (tempFiles.Count == 0)
            {
                return Result<Guid>.Failure(
                    $"No temporary files found for the provided keys: {string.Join(", ", request.TempDocuments)}");
            }

            // Validate all files belong to current user
            var filesNotOwnedByUser = tempFiles.Where(x => x.UploadedByUserId != userId).ToList();
            if (filesNotOwnedByUser.Any())
            {
                return Result<Guid>.Failure("You can only attach files uploaded by yourself.");
            }

            // Validate all files belong to current tenant
            var filesNotInTenant = tempFiles.Where(x => x.TenantId != tenantId.Value).ToList();
            if (filesNotInTenant.Any())
            {
                return Result<Guid>.Failure("Some files do not belong to the current tenant.");
            }
        }

        await using var transaction = await _dbContext.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create the announcement entity
            var announcement = Announcement.Create(
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

            _dbContext.Add(announcement);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Create audience entries
            foreach (var audienceInput in request.Audiences)
            {
                var audience = CreateAudienceEntity(announcement.Id, audienceInput, userId);
                _dbContext.Add(audience);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Process temp documents (images/videos)
            if (tempFiles != null && tempFiles.Count > 0)
            {
                var tenantId = _tenantContext.TenantId!.Value;
                var displayOrder = 0;

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

                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            // Handle publishing/scheduling
            if (request.PublishImmediately)
            {
                announcement.Publish(userId);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            else if (request.ScheduledAt.HasValue)
            {
                announcement.Schedule(request.ScheduledAt.Value, request.ExpiresAt, userId);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            return Result<Guid>.Success(announcement.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<Guid>.Failure($"Failed to create announcement: {ex.Message}");
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

            case AudienceTargetType.Community:
                // No additional validation needed for community-wide announcements
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
