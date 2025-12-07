using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Queries.ListAnnouncements;

/// <summary>
/// Handler for listing announcements.
/// </summary>
public class ListAnnouncementsQueryHandler
    : IRequestHandler<ListAnnouncementsQuery, Result<PagedResult<AnnouncementSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ListAnnouncementsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<PagedResult<AnnouncementSummaryDto>>> Handle(
        ListAnnouncementsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Announcements
            .AsNoTracking()
            .Where(a => a.IsActive);

        // For resident view, only show published and non-expired announcements
        if (request.ResidentView)
        {
            var now = DateTime.UtcNow;
            query = query.Where(a =>
                a.Status == AnnouncementStatus.Published &&
                (!a.ExpiresAt.HasValue || a.ExpiresAt.Value > now));

            // Filter by audience (residents see only announcements targeting them)
            if (_currentUser.TenantUserId.HasValue)
            {
                var userId = _currentUser.TenantUserId.Value;

                // Get user's units and role groups
                var userUnitIds = await GetUserUnitIdsAsync(userId, cancellationToken);
                var userBlockIds = await GetUserBlockIdsAsync(userId, cancellationToken);
                var userRoleGroupIds = await GetUserRoleGroupIdsAsync(userId, cancellationToken);

                // Filter announcements by audience
                var announcementIdsForUser = await _dbContext.AnnouncementAudiences
                    .AsNoTracking()
                    .Where(aa => aa.IsActive &&
                        (aa.TargetType == AudienceTargetType.Community ||
                         (aa.TargetType == AudienceTargetType.Unit && aa.UnitId.HasValue && userUnitIds.Contains(aa.UnitId.Value)) ||
                         (aa.TargetType == AudienceTargetType.Block && aa.BlockId.HasValue && userBlockIds.Contains(aa.BlockId.Value)) ||
                         (aa.TargetType == AudienceTargetType.RoleGroup && aa.RoleGroupId.HasValue && userRoleGroupIds.Contains(aa.RoleGroupId.Value))))
                    .Select(aa => aa.AnnouncementId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                query = query.Where(a => announcementIdsForUser.Contains(a.Id));
            }
        }
        else
        {
            // Admin view - apply status filter
            if (request.Status.HasValue)
            {
                query = query.Where(a => a.Status == request.Status.Value);
            }
        }

        // Apply common filters
        if (request.Category.HasValue)
        {
            query = query.Where(a => a.Category == request.Category.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(a => a.Priority == request.Priority.Value);
        }

        if (request.IsPinned.HasValue)
        {
            query = query.Where(a => a.IsPinned == request.IsPinned.Value);
        }

        if (request.IsEvent.HasValue)
        {
            query = query.Where(a => a.IsEvent == request.IsEvent.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(searchTerm) ||
                a.Body.ToLower().Contains(searchTerm));
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(a => a.PublishedAt >= request.FromDate.Value || a.ScheduledAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(a => a.PublishedAt <= request.ToDate.Value || a.ScheduledAt <= request.ToDate.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var announcements = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.PublishedAt ?? a.ScheduledAt ?? a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Get announcement IDs for batch queries
        var announcementIds = announcements.Select(a => a.Id).ToList();

        // Get engagement counts
        var likeCounts = await _dbContext.AnnouncementLikes
            .AsNoTracking()
            .Where(l => announcementIds.Contains(l.AnnouncementId) && l.IsActive)
            .GroupBy(l => l.AnnouncementId)
            .Select(g => new { AnnouncementId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AnnouncementId, x => x.Count, cancellationToken);

        var commentCounts = await _dbContext.AnnouncementComments
            .AsNoTracking()
            .Where(c => announcementIds.Contains(c.AnnouncementId) && c.IsActive && !c.IsHidden)
            .GroupBy(c => c.AnnouncementId)
            .Select(g => new { AnnouncementId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AnnouncementId, x => x.Count, cancellationToken);

        // Get read status for current user (resident view)
        var readAnnouncementIds = new HashSet<Guid>();
        if (request.ResidentView && _currentUser.TenantUserId.HasValue)
        {
            readAnnouncementIds = (await _dbContext.AnnouncementReads
                .AsNoTracking()
                .Where(r => announcementIds.Contains(r.AnnouncementId) &&
                           r.CommunityUserId == _currentUser.TenantUserId.Value &&
                           r.IsActive)
                .Select(r => r.AnnouncementId)
                .ToListAsync(cancellationToken))
                .ToHashSet();
        }

        // Get primary images
        var primaryImages = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.Announcement &&
                       announcementIds.Contains(d.OwnerId) &&
                       d.IsActive &&
                       d.DisplayOrder == 0)
            .ToDictionaryAsync(d => d.OwnerId, d => d.BlobPath, cancellationToken);

        // Map to DTOs
        var dtos = announcements.Select(a => new AnnouncementSummaryDto
        {
            Id = a.Id,
            Title = a.Title,
            Category = a.Category,
            Priority = a.Priority,
            Status = a.Status,
            PublishedAt = a.PublishedAt,
            IsPinned = a.IsPinned,
            IsBanner = a.IsBanner,
            IsEvent = a.IsEvent,
            EventStartAt = a.EventStartAt,
            LikeCount = likeCounts.GetValueOrDefault(a.Id, 0),
            CommentCount = commentCounts.GetValueOrDefault(a.Id, 0),
            HasRead = readAnnouncementIds.Contains(a.Id),
            PrimaryImageUrl = primaryImages.GetValueOrDefault(a.Id),
            TimeAgo = GetTimeAgo(a.PublishedAt ?? a.CreatedAt)
        }).ToList();

        return Result<PagedResult<AnnouncementSummaryDto>>.Success(
            new PagedResult<AnnouncementSummaryDto>(dtos, request.Page, request.PageSize, totalCount));
    }

    private async Task<List<Guid>> GetUserUnitIdsAsync(Guid userId, CancellationToken cancellationToken)
    {
        // Get the user's party ID
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(cu => cu.Id == userId && cu.IsActive, cancellationToken);

        if (communityUser == null) return new List<Guid>();

        // Get units where user has a lease
        var unitIds = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => lp.IsActive && lp.PartyId == communityUser.PartyId)
            .Join(_dbContext.Leases.AsNoTracking().Where(l => l.IsActive),
                lp => lp.LeaseId,
                l => l.Id,
                (lp, l) => l.UnitId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return unitIds;
    }

    private async Task<List<Guid>> GetUserBlockIdsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var unitIds = await GetUserUnitIdsAsync(userId, cancellationToken);
        if (unitIds.Count == 0) return new List<Guid>();

        return await _dbContext.Units
            .AsNoTracking()
            .Where(u => unitIds.Contains(u.Id) && u.IsActive)
            .Select(u => u.BlockId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private async Task<List<Guid>> GetUserRoleGroupIdsAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _dbContext.CommunityUserRoleGroups
            .AsNoTracking()
            .Where(curg => curg.CommunityUserId == userId && curg.IsActive)
            .Select(curg => curg.RoleGroupId)
            .ToListAsync(cancellationToken);
    }

    private static string GetTimeAgo(DateTime dateTime)
    {
        var timeSpan = DateTime.UtcNow - dateTime;

        if (timeSpan.TotalMinutes < 1)
            return "Just now";
        if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes} minutes ago";
        if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours} hours ago";
        if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays} days ago";
        if (timeSpan.TotalDays < 30)
            return $"{(int)(timeSpan.TotalDays / 7)} weeks ago";

        return dateTime.ToString("MMM d, yyyy");
    }
}
