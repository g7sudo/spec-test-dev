namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Status of a notification in the queue.
/// </summary>
public enum NotificationStatus
{
    /// <summary>
    /// Notification is pending and waiting to be processed.
    /// </summary>
    Pending,

    /// <summary>
    /// Notification is currently being processed.
    /// </summary>
    Processing,

    /// <summary>
    /// Notification was successfully sent via Firebase.
    /// </summary>
    Sent,

    /// <summary>
    /// Notification failed to send and may be retried.
    /// </summary>
    Failed,

    /// <summary>
    /// Notification was skipped due to deduplication.
    /// </summary>
    Deduplicated,

    /// <summary>
    /// Notification expired before it could be sent (TTL exceeded).
    /// </summary>
    Expired
}
