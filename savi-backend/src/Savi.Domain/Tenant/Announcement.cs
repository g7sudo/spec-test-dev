using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a community announcement created by admin/staff.
/// Supports lifecycle (Draft -> Scheduled -> Published -> Archived),
/// targeting by audience, and engagement (likes, comments, read status).
/// Maps to DBML: Table Announcement
/// </summary>
public class Announcement : BaseEntity
{
    /// <summary>
    /// Title of the announcement.
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Body content of the announcement (supports markdown/rich text).
    /// </summary>
    public string Body { get; private set; } = string.Empty;

    /// <summary>
    /// Category of the announcement.
    /// </summary>
    public AnnouncementCategory Category { get; private set; }

    /// <summary>
    /// Priority level of the announcement.
    /// </summary>
    public AnnouncementPriority Priority { get; private set; }

    /// <summary>
    /// Current lifecycle status.
    /// </summary>
    public AnnouncementStatus Status { get; private set; }

    /// <summary>
    /// When the announcement was/will be published.
    /// </summary>
    public DateTime? PublishedAt { get; private set; }

    /// <summary>
    /// Scheduled date/time for auto-publishing.
    /// </summary>
    public DateTime? ScheduledAt { get; private set; }

    /// <summary>
    /// When the announcement expires and should no longer be shown.
    /// </summary>
    public DateTime? ExpiresAt { get; private set; }

    // Display flags

    /// <summary>
    /// Whether the announcement is pinned to the top of the list.
    /// </summary>
    public bool IsPinned { get; private set; }

    /// <summary>
    /// Whether the announcement is displayed as a banner (prominent display).
    /// </summary>
    public bool IsBanner { get; private set; }

    // Behaviour flags

    /// <summary>
    /// Whether residents can like this announcement.
    /// </summary>
    public bool AllowLikes { get; private set; }

    /// <summary>
    /// Whether residents can comment on this announcement.
    /// </summary>
    public bool AllowComments { get; private set; }

    /// <summary>
    /// Whether residents can add this event to their calendar.
    /// </summary>
    public bool AllowAddToCalendar { get; private set; }

    // Event fields (for event-type announcements)

    /// <summary>
    /// Whether this announcement represents an event.
    /// </summary>
    public bool IsEvent { get; private set; }

    /// <summary>
    /// Event start date/time.
    /// </summary>
    public DateTime? EventStartAt { get; private set; }

    /// <summary>
    /// Event end date/time.
    /// </summary>
    public DateTime? EventEndAt { get; private set; }

    /// <summary>
    /// Whether the event spans all day.
    /// </summary>
    public bool IsAllDay { get; private set; }

    /// <summary>
    /// Free text location for the event.
    /// </summary>
    public string? EventLocationText { get; private set; }

    /// <summary>
    /// URL for joining virtual events.
    /// </summary>
    public string? EventJoinUrl { get; private set; }

    // EF Core constructor
    private Announcement() { }

    /// <summary>
    /// Creates a new announcement in Draft status.
    /// </summary>
    public static Announcement Create(
        string title,
        string body,
        AnnouncementCategory category,
        AnnouncementPriority priority,
        bool isPinned,
        bool isBanner,
        bool allowLikes,
        bool allowComments,
        bool allowAddToCalendar,
        bool isEvent,
        DateTime? eventStartAt,
        DateTime? eventEndAt,
        bool isAllDay,
        string? eventLocationText,
        string? eventJoinUrl,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Announcement title is required.", nameof(title));

        if (string.IsNullOrWhiteSpace(body))
            throw new ArgumentException("Announcement body is required.", nameof(body));

        if (isEvent)
        {
            if (!eventStartAt.HasValue)
                throw new ArgumentException("Event start date is required for event announcements.", nameof(eventStartAt));
        }

        var announcement = new Announcement
        {
            Title = title,
            Body = body,
            Category = category,
            Priority = priority,
            Status = AnnouncementStatus.Draft,
            IsPinned = isPinned,
            IsBanner = isBanner,
            AllowLikes = allowLikes,
            AllowComments = allowComments,
            AllowAddToCalendar = allowAddToCalendar,
            IsEvent = isEvent,
            EventStartAt = isEvent ? eventStartAt : null,
            EventEndAt = isEvent ? eventEndAt : null,
            IsAllDay = isEvent && isAllDay,
            EventLocationText = isEvent ? eventLocationText : null,
            EventJoinUrl = isEvent ? eventJoinUrl : null
        };

        announcement.SetCreatedBy(createdBy);
        return announcement;
    }

    /// <summary>
    /// Updates the announcement details.
    /// Only allowed for Draft or Scheduled status.
    /// </summary>
    public void Update(
        string title,
        string body,
        AnnouncementCategory category,
        AnnouncementPriority priority,
        bool isPinned,
        bool isBanner,
        bool allowLikes,
        bool allowComments,
        bool allowAddToCalendar,
        bool isEvent,
        DateTime? eventStartAt,
        DateTime? eventEndAt,
        bool isAllDay,
        string? eventLocationText,
        string? eventJoinUrl,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Announcement title is required.", nameof(title));

        if (string.IsNullOrWhiteSpace(body))
            throw new ArgumentException("Announcement body is required.", nameof(body));

        if (isEvent && !eventStartAt.HasValue)
            throw new ArgumentException("Event start date is required for event announcements.", nameof(eventStartAt));

        Title = title;
        Body = body;
        Category = category;
        Priority = priority;
        IsPinned = isPinned;
        IsBanner = isBanner;
        AllowLikes = allowLikes;
        AllowComments = allowComments;
        AllowAddToCalendar = allowAddToCalendar;
        IsEvent = isEvent;
        EventStartAt = isEvent ? eventStartAt : null;
        EventEndAt = isEvent ? eventEndAt : null;
        IsAllDay = isEvent && isAllDay;
        EventLocationText = isEvent ? eventLocationText : null;
        EventJoinUrl = isEvent ? eventJoinUrl : null;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Publishes the announcement immediately.
    /// </summary>
    public void Publish(Guid updatedBy)
    {
        if (Status == AnnouncementStatus.Archived)
            throw new InvalidOperationException("Cannot publish an archived announcement.");

        Status = AnnouncementStatus.Published;
        PublishedAt = DateTime.UtcNow;
        ScheduledAt = null;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Schedules the announcement for future publication.
    /// </summary>
    public void Schedule(DateTime scheduledAt, DateTime? expiresAt, Guid updatedBy)
    {
        if (scheduledAt <= DateTime.UtcNow)
            throw new ArgumentException("Scheduled date must be in the future.", nameof(scheduledAt));

        if (expiresAt.HasValue && expiresAt.Value <= scheduledAt)
            throw new ArgumentException("Expiry date must be after the scheduled date.", nameof(expiresAt));

        Status = AnnouncementStatus.Scheduled;
        ScheduledAt = scheduledAt;
        ExpiresAt = expiresAt;
        PublishedAt = null;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Archives the announcement.
    /// </summary>
    public void Archive(Guid updatedBy)
    {
        Status = AnnouncementStatus.Archived;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Pins the announcement to the top of the list.
    /// </summary>
    public void Pin(Guid updatedBy)
    {
        IsPinned = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Unpins the announcement.
    /// </summary>
    public void Unpin(Guid updatedBy)
    {
        IsPinned = false;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Toggles the banner display.
    /// </summary>
    public void SetBanner(bool isBanner, Guid updatedBy)
    {
        IsBanner = isBanner;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Disables comments on the announcement.
    /// </summary>
    public void DisableComments(Guid updatedBy)
    {
        AllowComments = false;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Enables comments on the announcement.
    /// </summary>
    public void EnableComments(Guid updatedBy)
    {
        AllowComments = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets the expiry date for the announcement.
    /// </summary>
    public void SetExpiryDate(DateTime? expiresAt, Guid updatedBy)
    {
        ExpiresAt = expiresAt;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if the announcement is currently visible to residents.
    /// </summary>
    public bool IsVisibleToResidents =>
        IsActive &&
        Status == AnnouncementStatus.Published &&
        (!ExpiresAt.HasValue || ExpiresAt.Value > DateTime.UtcNow);
}
