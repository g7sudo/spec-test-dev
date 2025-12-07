namespace Savi.Application.Platform.Notifications.Dtos;

/// <summary>
/// Response DTO for broadcast notification operation.
/// </summary>
public sealed record BroadcastNotificationResponse(
    int QueuedCount,
    string Message
);
