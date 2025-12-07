namespace Savi.SharedKernel.Interfaces;

/// <summary>
/// Service for sending push notifications via Firebase Cloud Messaging.
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// Sends a push notification to a single device.
    /// </summary>
    /// <param name="deviceToken">The FCM device token.</param>
    /// <param name="title">Notification title.</param>
    /// <param name="body">Notification body.</param>
    /// <param name="data">Optional data payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure with error message.</returns>
    Task<PushNotificationResult> SendToDeviceAsync(
        string deviceToken,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a push notification to multiple devices (batch).
    /// </summary>
    /// <param name="deviceTokens">List of FCM device tokens.</param>
    /// <param name="title">Notification title.</param>
    /// <param name="body">Notification body.</param>
    /// <param name="data">Optional data payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result with success and failure counts.</returns>
    Task<PushNotificationBatchResult> SendToDevicesAsync(
        IEnumerable<string> deviceTokens,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a push notification to a topic.
    /// </summary>
    /// <param name="topic">The topic name.</param>
    /// <param name="title">Notification title.</param>
    /// <param name="body">Notification body.</param>
    /// <param name="data">Optional data payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure.</returns>
    Task<PushNotificationResult> SendToTopicAsync(
        string topic,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Subscribes a device to a topic.
    /// </summary>
    /// <param name="deviceToken">The FCM device token.</param>
    /// <param name="topic">The topic name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure.</returns>
    Task<PushNotificationResult> SubscribeToTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Unsubscribes a device from a topic.
    /// </summary>
    /// <param name="deviceToken">The FCM device token.</param>
    /// <param name="topic">The topic name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure.</returns>
    Task<PushNotificationResult> UnsubscribeFromTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a single push notification operation.
/// </summary>
public record PushNotificationResult(
    bool Success,
    string? MessageId = null,
    string? ErrorCode = null,
    string? ErrorMessage = null
);

/// <summary>
/// Result of a batch push notification operation.
/// </summary>
public record PushNotificationBatchResult(
    int SuccessCount,
    int FailureCount,
    List<PushNotificationFailure>? Failures = null
);

/// <summary>
/// Details of a failed push notification in a batch.
/// </summary>
public record PushNotificationFailure(
    string DeviceToken,
    string ErrorCode,
    string ErrorMessage
);
