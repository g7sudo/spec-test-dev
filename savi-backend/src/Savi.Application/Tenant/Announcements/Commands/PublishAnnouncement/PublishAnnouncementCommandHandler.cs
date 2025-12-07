using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.PublishAnnouncement;

/// <summary>
/// Handler for publishing an announcement.
/// </summary>
public class PublishAnnouncementCommandHandler : IRequestHandler<PublishAnnouncementCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public PublishAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        PublishAnnouncementCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (announcement == null)
        {
            return Result.Failure("Announcement not found.");
        }

        if (announcement.Status == AnnouncementStatus.Archived)
        {
            return Result.Failure("Cannot publish an archived announcement.");
        }

        try
        {
            if (request.PublishImmediately)
            {
                announcement.Publish(userId);
            }
            else if (request.ScheduledAt.HasValue)
            {
                announcement.Schedule(request.ScheduledAt.Value, request.ExpiresAt, userId);
            }
            else
            {
                return Result.Failure("Either publish immediately or provide a scheduled date.");
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to publish announcement: {ex.Message}");
        }
    }
}
