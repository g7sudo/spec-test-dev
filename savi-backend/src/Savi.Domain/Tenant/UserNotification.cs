using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a notification sent to a user for display in the notification bell/list.
/// Stored in tenant database for persistent history and read status tracking.
/// </summary>
public class UserNotification : BaseEntity
{
    /// <summary>
    /// The community user who receives this notification.
    /// </summary>
    public Guid CommunityUserId { get; private set; }

    /// <summary>
    /// Notification title (short, displayed in list).
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Notification body/message content.
    /// </summary>
    public string Body { get; private set; } = string.Empty;

    /// <summary>
    /// Category of the notification for filtering and display.
    /// </summary>
    public NotificationCategory Category { get; private set; }

    /// <summary>
    /// Whether the notification has been read by the user.
    /// </summary>
    public bool IsRead { get; private set; }

    /// <summary>
    /// When the notification was read (null if unread).
    /// </summary>
    public DateTime? ReadAt { get; private set; }

    /// <summary>
    /// Optional deep link URL for navigation when tapped.
    /// E.g., "/maintenance/requests/123" or "/amenities/bookings/456"
    /// </summary>
    public string? ActionUrl { get; private set; }

    /// <summary>
    /// Optional reference entity type (e.g., "MaintenanceRequest", "AmenityBooking").
    /// Used for linking to related records.
    /// </summary>
    public string? ReferenceType { get; private set; }

    /// <summary>
    /// Optional reference entity ID.
    /// </summary>
    public Guid? ReferenceId { get; private set; }

    /// <summary>
    /// Optional image URL for rich notifications.
    /// </summary>
    public string? ImageUrl { get; private set; }

    /// <summary>
    /// Additional data payload as JSON (for app-specific handling).
    /// </summary>
    public string? DataPayload { get; private set; }

    // Navigation property
    public CommunityUser? CommunityUser { get; private set; }

    // EF Core constructor
    private UserNotification() { }

    /// <summary>
    /// Creates a new user notification.
    /// </summary>
    public static UserNotification Create(
        Guid communityUserId,
        string title,
        string body,
        NotificationCategory category,
        string? actionUrl = null,
        string? referenceType = null,
        Guid? referenceId = null,
        string? imageUrl = null,
        string? dataPayload = null)
    {
        if (communityUserId == Guid.Empty)
            throw new ArgumentException("Community user ID is required.", nameof(communityUserId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Notification title is required.", nameof(title));

        if (string.IsNullOrWhiteSpace(body))
            throw new ArgumentException("Notification body is required.", nameof(body));

        var notification = new UserNotification
        {
            CommunityUserId = communityUserId,
            Title = title,
            Body = body,
            Category = category,
            IsRead = false,
            ReadAt = null,
            ActionUrl = actionUrl,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            ImageUrl = imageUrl,
            DataPayload = dataPayload
        };

        // System-generated notification, no user creator
        notification.SetCreatedBy(Guid.Empty);
        return notification;
    }

    /// <summary>
    /// Marks the notification as read.
    /// </summary>
    public void MarkAsRead()
    {
        if (!IsRead)
        {
            IsRead = true;
            ReadAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Marks the notification as unread.
    /// </summary>
    public void MarkAsUnread()
    {
        IsRead = false;
        ReadAt = null;
    }
}
