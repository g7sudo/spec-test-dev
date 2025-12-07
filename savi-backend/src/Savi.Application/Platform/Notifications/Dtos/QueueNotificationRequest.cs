namespace Savi.Application.Platform.Notifications.Dtos;

/// <summary>
/// Request DTO for queueing a notification from a tenant.
/// </summary>
public sealed record QueueNotificationRequest
{
    /// <summary>
    /// The platform user ID who should receive this notification.
    /// </summary>
    public Guid PlatformUserId { get; init; }

    /// <summary>
    /// Notification title.
    /// </summary>
    public string Title { get; init; } = string.Empty;

    /// <summary>
    /// Notification body/message.
    /// </summary>
    public string Body { get; init; } = string.Empty;

    /// <summary>
    /// Optional JSON data payload for the notification.
    /// Used by mobile app for deep linking or custom actions.
    /// </summary>
    public string? Data { get; init; }

    /// <summary>
    /// Optional deduplication key to prevent duplicate notifications.
    /// Same key within 5 minutes will be deduplicated.
    /// </summary>
    public string? DeduplicationKey { get; init; }

    /// <summary>
    /// Priority level: "Low", "Normal", or "High".
    /// Default is "Normal".
    /// </summary>
    public string Priority { get; init; } = "Normal";

    /// <summary>
    /// Optional expiration time. Notification won't be sent after this time.
    /// </summary>
    public DateTime? ExpiresAt { get; init; }
}
