using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
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

    public UpdateAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
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
