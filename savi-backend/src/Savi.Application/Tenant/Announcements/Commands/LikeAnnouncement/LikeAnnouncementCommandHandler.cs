using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Commands.LikeAnnouncement;

/// <summary>
/// Handler for liking/unliking an announcement.
/// </summary>
public class LikeAnnouncementCommandHandler : IRequestHandler<LikeAnnouncementCommand, Result<int>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public LikeAnnouncementCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        LikeAnnouncementCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<int>.Failure("User does not exist in the current tenant.");
        }

        var userId = _currentUser.TenantUserId.Value;

        // Verify announcement exists and allows likes
        var announcement = await _dbContext.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AnnouncementId &&
                                      a.IsActive &&
                                      a.Status == AnnouncementStatus.Published,
                cancellationToken);

        if (announcement == null)
        {
            return Result<int>.Failure("Announcement not found.");
        }

        if (!announcement.AllowLikes)
        {
            return Result<int>.Failure("Likes are not enabled for this announcement.");
        }

        // Check for existing like
        var existingLike = await _dbContext.AnnouncementLikes
            .FirstOrDefaultAsync(l => l.AnnouncementId == request.AnnouncementId &&
                                      l.CommunityUserId == userId,
                cancellationToken);

        if (request.Like)
        {
            // Add like
            if (existingLike == null)
            {
                var like = AnnouncementLike.Create(request.AnnouncementId, userId);
                _dbContext.Add(like);
            }
            else if (!existingLike.IsActive)
            {
                existingLike.Activate(userId);
            }
            // If already liked and active, do nothing
        }
        else
        {
            // Remove like
            if (existingLike != null && existingLike.IsActive)
            {
                existingLike.Deactivate(userId);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Return updated like count
        var likeCount = await _dbContext.AnnouncementLikes
            .AsNoTracking()
            .CountAsync(l => l.AnnouncementId == request.AnnouncementId && l.IsActive,
                cancellationToken);

        return Result<int>.Success(likeCount);
    }
}
