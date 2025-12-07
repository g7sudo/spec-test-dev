using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Announcements.Dtos;

/// <summary>
/// Detailed DTO for announcement (single announcement view).
/// </summary>
public record AnnouncementDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public AnnouncementCategory Category { get; init; }
    public AnnouncementPriority Priority { get; init; }
    public AnnouncementStatus Status { get; init; }
    public DateTime? PublishedAt { get; init; }
    public DateTime? ScheduledAt { get; init; }
    public DateTime? ExpiresAt { get; init; }

    // Display flags
    public bool IsPinned { get; init; }
    public bool IsBanner { get; init; }

    // Behaviour flags
    public bool AllowLikes { get; init; }
    public bool AllowComments { get; init; }
    public bool AllowAddToCalendar { get; init; }

    // Event fields
    public bool IsEvent { get; init; }
    public DateTime? EventStartAt { get; init; }
    public DateTime? EventEndAt { get; init; }
    public bool IsAllDay { get; init; }
    public string? EventLocationText { get; init; }
    public string? EventJoinUrl { get; init; }

    // Engagement stats
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public int ReadCount { get; init; }

    // Current user engagement (for resident view)
    public bool HasLiked { get; init; }
    public bool HasRead { get; init; }

    // Audience information
    public List<AnnouncementAudienceDto> Audiences { get; init; } = new();

    // Images (from Document entity)
    public List<AnnouncementImageDto> Images { get; init; } = new();

    // Author information
    public AnnouncementAuthorDto? Author { get; init; }

    // Audit
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>
/// Summary DTO for announcement list views.
/// </summary>
public record AnnouncementSummaryDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public AnnouncementCategory Category { get; init; }
    public AnnouncementPriority Priority { get; init; }
    public AnnouncementStatus Status { get; init; }
    public DateTime? PublishedAt { get; init; }
    public bool IsPinned { get; init; }
    public bool IsBanner { get; init; }
    public bool IsEvent { get; init; }
    public DateTime? EventStartAt { get; init; }

    // Engagement counts
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }

    // Current user status (for resident view)
    public bool HasRead { get; init; }

    // Primary image (first image as thumbnail)
    public string? PrimaryImageUrl { get; init; }

    // Time display
    public string TimeAgo { get; init; } = string.Empty;
}

/// <summary>
/// DTO for announcement audience targeting.
/// </summary>
public record AnnouncementAudienceDto
{
    public Guid Id { get; init; }
    public AudienceTargetType TargetType { get; init; }
    public Guid? BlockId { get; init; }
    public string? BlockName { get; init; }
    public Guid? UnitId { get; init; }
    public string? UnitNumber { get; init; }
    public Guid? RoleGroupId { get; init; }
    public string? RoleGroupName { get; init; }
}

/// <summary>
/// DTO for announcement images.
/// </summary>
public record AnnouncementImageDto
{
    public Guid Id { get; init; }
    public string Url { get; init; } = string.Empty;
    public string? FileName { get; init; }
    public int SortOrder { get; init; }
}

/// <summary>
/// DTO for announcement author information.
/// </summary>
public record AnnouncementAuthorDto
{
    public Guid Id { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string? ProfileImageUrl { get; init; }
}
