using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Queries.ListAnnouncementComments;

/// <summary>
/// Handler for listing comments for an announcement.
/// </summary>
public class ListAnnouncementCommentsQueryHandler
    : IRequestHandler<ListAnnouncementCommentsQuery, Result<PagedResult<AnnouncementCommentDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ListAnnouncementCommentsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<PagedResult<AnnouncementCommentDto>>> Handle(
        ListAnnouncementCommentsQuery request,
        CancellationToken cancellationToken)
    {
        // Verify announcement exists
        var announcementExists = await _dbContext.Announcements
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.AnnouncementId && a.IsActive, cancellationToken);

        if (!announcementExists)
        {
            return Result<PagedResult<AnnouncementCommentDto>>.Failure("Announcement not found.");
        }

        // Query top-level comments (no parent)
        var query = _dbContext.AnnouncementComments
            .AsNoTracking()
            .Where(c => c.AnnouncementId == request.AnnouncementId &&
                       c.IsActive &&
                       c.ParentCommentId == null);

        // Filter hidden comments for non-admin view
        if (!request.IncludeHidden)
        {
            query = query.Where(c => !c.IsHidden);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var comments = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Get all replies for these comments
        var commentIds = comments.Select(c => c.Id).ToList();
        var repliesQuery = _dbContext.AnnouncementComments
            .AsNoTracking()
            .Where(c => c.AnnouncementId == request.AnnouncementId &&
                       c.IsActive &&
                       c.ParentCommentId.HasValue &&
                       commentIds.Contains(c.ParentCommentId.Value));

        if (!request.IncludeHidden)
        {
            repliesQuery = repliesQuery.Where(c => !c.IsHidden);
        }

        var replies = await repliesQuery
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        // Get all user IDs for author lookup
        var allUserIds = comments.Select(c => c.CommunityUserId)
            .Union(replies.Select(r => r.CommunityUserId))
            .Distinct()
            .ToList();

        // Get user profiles
        var userProfiles = await _dbContext.CommunityUserProfiles
            .AsNoTracking()
            .Where(p => allUserIds.Contains(p.CommunityUserId))
            .ToDictionaryAsync(p => p.CommunityUserId, cancellationToken);

        var users = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(u => allUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        // Get profile photo URLs
        var profilePhotoDocIds = userProfiles.Values
            .Where(p => p.ProfilePhotoDocumentId.HasValue)
            .Select(p => p.ProfilePhotoDocumentId!.Value)
            .ToList();

        var profilePhotos = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => profilePhotoDocIds.Contains(d.Id) && d.IsActive)
            .ToDictionaryAsync(d => d.Id, d => d.BlobPath, cancellationToken);

        // Map to DTOs
        var dtos = comments.Select(c => MapToDto(c, replies, users, userProfiles, profilePhotos)).ToList();

        return Result<PagedResult<AnnouncementCommentDto>>.Success(
            new PagedResult<AnnouncementCommentDto>(dtos, request.Page, request.PageSize, totalCount));
    }

    private AnnouncementCommentDto MapToDto(
        Domain.Tenant.AnnouncementComment comment,
        List<Domain.Tenant.AnnouncementComment> allReplies,
        Dictionary<Guid, Domain.Tenant.CommunityUser> users,
        Dictionary<Guid, Domain.Tenant.CommunityUserProfile> profiles,
        Dictionary<Guid, string> profilePhotos)
    {
        var user = users.GetValueOrDefault(comment.CommunityUserId);
        var profile = profiles.GetValueOrDefault(comment.CommunityUserId);

        var replies = allReplies
            .Where(r => r.ParentCommentId == comment.Id)
            .Select(r => MapReplyToDto(r, users, profiles, profilePhotos))
            .ToList();

        string? profileImageUrl = null;
        if (profile?.ProfilePhotoDocumentId.HasValue == true)
        {
            profilePhotos.TryGetValue(profile.ProfilePhotoDocumentId.Value, out profileImageUrl);
        }

        return new AnnouncementCommentDto
        {
            Id = comment.Id,
            AnnouncementId = comment.AnnouncementId,
            Content = comment.Content,
            IsHidden = comment.IsHidden,
            ParentCommentId = comment.ParentCommentId,
            Author = new CommentAuthorDto
            {
                Id = comment.CommunityUserId,
                DisplayName = profile?.DisplayName ?? user?.PreferredName ?? "Unknown",
                ProfileImageUrl = profileImageUrl,
                IsCurrentUser = _currentUser.TenantUserId.HasValue &&
                               comment.CommunityUserId == _currentUser.TenantUserId.Value
            },
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            Replies = replies
        };
    }

    private AnnouncementCommentDto MapReplyToDto(
        Domain.Tenant.AnnouncementComment reply,
        Dictionary<Guid, Domain.Tenant.CommunityUser> users,
        Dictionary<Guid, Domain.Tenant.CommunityUserProfile> profiles,
        Dictionary<Guid, string> profilePhotos)
    {
        var user = users.GetValueOrDefault(reply.CommunityUserId);
        var profile = profiles.GetValueOrDefault(reply.CommunityUserId);

        string? profileImageUrl = null;
        if (profile?.ProfilePhotoDocumentId.HasValue == true)
        {
            profilePhotos.TryGetValue(profile.ProfilePhotoDocumentId.Value, out profileImageUrl);
        }

        return new AnnouncementCommentDto
        {
            Id = reply.Id,
            AnnouncementId = reply.AnnouncementId,
            Content = reply.Content,
            IsHidden = reply.IsHidden,
            ParentCommentId = reply.ParentCommentId,
            Author = new CommentAuthorDto
            {
                Id = reply.CommunityUserId,
                DisplayName = profile?.DisplayName ?? user?.PreferredName ?? "Unknown",
                ProfileImageUrl = profileImageUrl,
                IsCurrentUser = _currentUser.TenantUserId.HasValue &&
                               reply.CommunityUserId == _currentUser.TenantUserId.Value
            },
            CreatedAt = reply.CreatedAt,
            UpdatedAt = reply.UpdatedAt,
            Replies = new List<AnnouncementCommentDto>() // Only one level of nesting
        };
    }
}
