using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Announcements.Queries.GetAnnouncementById;

/// <summary>
/// Handler for getting a single announcement by ID.
/// </summary>
public class GetAnnouncementByIdQueryHandler
    : IRequestHandler<GetAnnouncementByIdQuery, Result<AnnouncementDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorageService;

    private const int SasTokenExpiryMinutes = 60;

    public GetAnnouncementByIdQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<AnnouncementDto>> Handle(
        GetAnnouncementByIdQuery request,
        CancellationToken cancellationToken)
    {
        var announcement = await _dbContext.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.IsActive, cancellationToken);

        if (announcement == null)
        {
            return Result<AnnouncementDto>.Failure("Announcement not found.");
        }

        // For resident view, verify the announcement is visible
        if (request.ResidentView)
        {
            if (announcement.Status != AnnouncementStatus.Published)
            {
                return Result<AnnouncementDto>.Failure("Announcement not found.");
            }

            if (announcement.ExpiresAt.HasValue && announcement.ExpiresAt.Value <= DateTime.UtcNow)
            {
                return Result<AnnouncementDto>.Failure("Announcement has expired.");
            }
        }

        // Get audiences
        var audiences = await _dbContext.AnnouncementAudiences
            .AsNoTracking()
            .Where(aa => aa.AnnouncementId == request.Id && aa.IsActive)
            .ToListAsync(cancellationToken);

        // Get audience details (block names, unit numbers, role group names)
        var audienceDtos = await GetAudienceDtosAsync(audiences, cancellationToken);

        // Get engagement counts
        var likeCount = await _dbContext.AnnouncementLikes
            .AsNoTracking()
            .CountAsync(l => l.AnnouncementId == request.Id && l.IsActive, cancellationToken);

        var commentCount = await _dbContext.AnnouncementComments
            .AsNoTracking()
            .CountAsync(c => c.AnnouncementId == request.Id && c.IsActive && !c.IsHidden, cancellationToken);

        var readCount = await _dbContext.AnnouncementReads
            .AsNoTracking()
            .CountAsync(r => r.AnnouncementId == request.Id && r.IsActive, cancellationToken);

        // Get current user engagement status
        var hasLiked = false;
        var hasRead = false;

        if (_currentUser.TenantUserId.HasValue)
        {
            var userId = _currentUser.TenantUserId.Value;

            hasLiked = await _dbContext.AnnouncementLikes
                .AsNoTracking()
                .AnyAsync(l => l.AnnouncementId == request.Id &&
                              l.CommunityUserId == userId &&
                              l.IsActive, cancellationToken);

            hasRead = await _dbContext.AnnouncementReads
                .AsNoTracking()
                .AnyAsync(r => r.AnnouncementId == request.Id &&
                              r.CommunityUserId == userId &&
                              r.IsActive, cancellationToken);

            // Mark as read for resident view
            if (request.ResidentView && !hasRead)
            {
                var readRecord = AnnouncementRead.Create(request.Id, userId);
                _dbContext.Add(readRecord);
                await _dbContext.SaveChangesAsync(cancellationToken);
                hasRead = true;
            }
        }

        // Get images and generate SAS URLs
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => d.OwnerType == DocumentOwnerType.Announcement &&
                       d.OwnerId == request.Id &&
                       d.IsActive)
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync(cancellationToken);

        var images = new List<AnnouncementImageDto>();
        foreach (var doc in documents)
        {
            var downloadUrl = await _fileStorageService.GetDownloadUrlAsync(
                doc.BlobPath,
                SasTokenExpiryMinutes,
                cancellationToken);

            images.Add(new AnnouncementImageDto
            {
                Id = doc.Id,
                Url = downloadUrl,
                FileName = doc.FileName,
                SortOrder = doc.DisplayOrder
            });
        }

        // Get author info
        var author = await GetAuthorAsync(announcement.CreatedBy, cancellationToken);

        var dto = new AnnouncementDto
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Body = announcement.Body,
            Category = announcement.Category,
            Priority = announcement.Priority,
            Status = announcement.Status,
            PublishedAt = announcement.PublishedAt,
            ScheduledAt = announcement.ScheduledAt,
            ExpiresAt = announcement.ExpiresAt,
            IsPinned = announcement.IsPinned,
            IsBanner = announcement.IsBanner,
            AllowLikes = announcement.AllowLikes,
            AllowComments = announcement.AllowComments,
            AllowAddToCalendar = announcement.AllowAddToCalendar,
            IsEvent = announcement.IsEvent,
            EventStartAt = announcement.EventStartAt,
            EventEndAt = announcement.EventEndAt,
            IsAllDay = announcement.IsAllDay,
            EventLocationText = announcement.EventLocationText,
            EventJoinUrl = announcement.EventJoinUrl,
            LikeCount = likeCount,
            CommentCount = commentCount,
            ReadCount = readCount,
            HasLiked = hasLiked,
            HasRead = hasRead,
            Audiences = audienceDtos,
            Images = images,
            Author = author,
            IsActive = announcement.IsActive,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt
        };

        return Result<AnnouncementDto>.Success(dto);
    }

    private async Task<List<AnnouncementAudienceDto>> GetAudienceDtosAsync(
        List<AnnouncementAudience> audiences,
        CancellationToken cancellationToken)
    {
        // Collect IDs by type to batch load (avoid N+1 queries)
        var blockIds = audiences.Where(a => a.BlockId.HasValue).Select(a => a.BlockId!.Value).ToList();
        var unitIds = audiences.Where(a => a.UnitId.HasValue).Select(a => a.UnitId!.Value).ToList();
        var roleGroupIds = audiences.Where(a => a.RoleGroupId.HasValue).Select(a => a.RoleGroupId!.Value).ToList();

        // Batch load all related entities at once
        var blocks = blockIds.Count > 0
            ? await _dbContext.Blocks.AsNoTracking()
                .Where(b => blockIds.Contains(b.Id))
                .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        var units = unitIds.Count > 0
            ? await _dbContext.Units.AsNoTracking()
                .Where(u => unitIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UnitNumber, cancellationToken)
            : new Dictionary<Guid, string>();

        var roleGroups = roleGroupIds.Count > 0
            ? await _dbContext.RoleGroups.AsNoTracking()
                .Where(r => roleGroupIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // Map using dictionaries (no DB calls in loop)
        return audiences.Select(audience => new AnnouncementAudienceDto
        {
            Id = audience.Id,
            TargetType = audience.TargetType,
            BlockId = audience.BlockId,
            BlockName = audience.BlockId.HasValue ? blocks.GetValueOrDefault(audience.BlockId.Value) : null,
            UnitId = audience.UnitId,
            UnitNumber = audience.UnitId.HasValue ? units.GetValueOrDefault(audience.UnitId.Value) : null,
            RoleGroupId = audience.RoleGroupId,
            RoleGroupName = audience.RoleGroupId.HasValue ? roleGroups.GetValueOrDefault(audience.RoleGroupId.Value) : null
        }).ToList();
    }

    private async Task<AnnouncementAuthorDto?> GetAuthorAsync(Guid? createdBy, CancellationToken cancellationToken)
    {
        if (!createdBy.HasValue)
            return null;

        var user = await _dbContext.CommunityUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == createdBy.Value, cancellationToken);

        if (user == null)
            return null;

        var profile = await _dbContext.CommunityUserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.CommunityUserId == user.Id, cancellationToken);

        // Get profile image URL from document if exists
        string? profileImageUrl = null;
        if (profile?.ProfilePhotoDocumentId.HasValue == true)
        {
            var doc = await _dbContext.Documents
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == profile.ProfilePhotoDocumentId.Value && d.IsActive, cancellationToken);

            if (doc != null)
            {
                profileImageUrl = await _fileStorageService.GetDownloadUrlAsync(
                    doc.BlobPath,
                    SasTokenExpiryMinutes,
                    cancellationToken);
            }
        }

        return new AnnouncementAuthorDto
        {
            Id = user.Id,
            DisplayName = profile?.DisplayName ?? user.PreferredName ?? "Unknown",
            ProfileImageUrl = profileImageUrl
        };
    }
}
