namespace Savi.Application.Platform.Notifications.Dtos;

/// <summary>
/// Request DTO for broadcasting a platform-wide notification.
/// Platform admin only.
/// </summary>
public sealed record BroadcastNotificationRequest
{
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
    /// </summary>
    public string? Data { get; init; }

    /// <summary>
    /// Priority level: "Low", "Normal", or "High".
    /// Default is "High" for broadcasts.
    /// </summary>
    public string Priority { get; init; } = "High";
}
