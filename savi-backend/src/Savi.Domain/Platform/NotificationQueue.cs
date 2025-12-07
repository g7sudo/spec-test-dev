using Savi.Domain.Common;
using Savi.Domain.Platform.Enums;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents a queued notification to be sent via Firebase Cloud Messaging.
///
/// Notifications are queued by tenants or platform and processed by a background
/// worker that handles deduplication, rate limiting, and actual delivery.
/// </summary>
public class NotificationQueue : BaseEntity
{
    /// <summary>
    /// The platform user who should receive this notification.
    /// </summary>
    public Guid PlatformUserId { get; private set; }

    /// <summary>
    /// Notification title displayed to the user.
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Notification body/message displayed to the user.
    /// </summary>
    public string Body { get; private set; } = string.Empty;

    /// <summary>
    /// Additional data payload (JSON) sent with the notification.
    /// Used by the mobile app to handle deep linking or actions.
    /// </summary>
    public string? Data { get; private set; }

    /// <summary>
    /// Source type indicating where this notification came from.
    /// </summary>
    public NotificationSourceType SourceType { get; private set; }

    /// <summary>
    /// If SourceType is Tenant, this is the tenant that queued the notification.
    /// Null for platform-level notifications.
    /// </summary>
    public Guid? SourceTenantId { get; private set; }

    /// <summary>
    /// Optional key for deduplication.
    /// Notifications with the same key within a time window are deduplicated.
    /// </summary>
    public string? DeduplicationKey { get; private set; }

    /// <summary>
    /// Priority level for processing order.
    /// </summary>
    public NotificationPriority Priority { get; private set; } = NotificationPriority.Normal;

    /// <summary>
    /// Current status of the notification.
    /// </summary>
    public NotificationStatus Status { get; private set; } = NotificationStatus.Pending;

    /// <summary>
    /// Number of retry attempts made for failed notifications.
    /// </summary>
    public int RetryCount { get; private set; } = 0;

    /// <summary>
    /// Maximum number of retry attempts allowed.
    /// </summary>
    public int MaxRetries { get; private set; } = 3;

    /// <summary>
    /// Error message if the notification failed.
    /// </summary>
    public string? ErrorMessage { get; private set; }

    /// <summary>
    /// Timestamp when the notification was processed (sent or failed).
    /// </summary>
    public DateTime? ProcessedAt { get; private set; }

    /// <summary>
    /// Optional expiration time. Notifications past this time are marked as expired.
    /// </summary>
    public DateTime? ExpiresAt { get; private set; }

    /// <summary>
    /// Timestamp when processing should be attempted next (for retries).
    /// </summary>
    public DateTime? NextRetryAt { get; private set; }

    // Navigation property
    public PlatformUser? PlatformUser { get; private set; }

    // Private constructor for EF
    private NotificationQueue() { }

    /// <summary>
    /// Creates a new notification queue entry.
    /// </summary>
    public static NotificationQueue Create(
        Guid platformUserId,
        string title,
        string body,
        NotificationSourceType sourceType,
        Guid? sourceTenantId = null,
        string? data = null,
        string? deduplicationKey = null,
        NotificationPriority priority = NotificationPriority.Normal,
        DateTime? expiresAt = null,
        Guid? createdBy = null)
    {
        var notification = new NotificationQueue
        {
            PlatformUserId = platformUserId,
            Title = title,
            Body = body,
            SourceType = sourceType,
            SourceTenantId = sourceTenantId,
            Data = data,
            DeduplicationKey = deduplicationKey,
            Priority = priority,
            ExpiresAt = expiresAt,
            Status = NotificationStatus.Pending
        };

        notification.SetCreatedBy(createdBy);
        return notification;
    }

    /// <summary>
    /// Marks the notification as currently being processed.
    /// </summary>
    public void MarkAsProcessing()
    {
        Status = NotificationStatus.Processing;
    }

    /// <summary>
    /// Marks the notification as successfully sent.
    /// </summary>
    public void MarkAsSent()
    {
        Status = NotificationStatus.Sent;
        ProcessedAt = DateTime.UtcNow;
        ErrorMessage = null;
    }

    /// <summary>
    /// Marks the notification as failed with retry scheduling.
    /// </summary>
    public void MarkAsFailed(string errorMessage)
    {
        RetryCount++;
        ErrorMessage = errorMessage;

        if (RetryCount >= MaxRetries)
        {
            Status = NotificationStatus.Failed;
            ProcessedAt = DateTime.UtcNow;
        }
        else
        {
            // Exponential backoff: 1min, 4min, 9min, etc.
            Status = NotificationStatus.Pending;
            NextRetryAt = DateTime.UtcNow.AddMinutes(RetryCount * RetryCount);
        }
    }

    /// <summary>
    /// Marks the notification as deduplicated (skipped).
    /// </summary>
    public void MarkAsDeduplicated()
    {
        Status = NotificationStatus.Deduplicated;
        ProcessedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the notification as expired.
    /// </summary>
    public void MarkAsExpired()
    {
        Status = NotificationStatus.Expired;
        ProcessedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Checks if the notification has expired.
    /// </summary>
    public bool IsExpired => ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt.Value;

    /// <summary>
    /// Checks if the notification is ready for processing.
    /// </summary>
    public bool IsReadyForProcessing =>
        Status == NotificationStatus.Pending &&
        (!NextRetryAt.HasValue || DateTime.UtcNow >= NextRetryAt.Value);
}
