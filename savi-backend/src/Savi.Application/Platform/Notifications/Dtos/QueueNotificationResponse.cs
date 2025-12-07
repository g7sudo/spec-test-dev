namespace Savi.Application.Platform.Notifications.Dtos;

/// <summary>
/// Response DTO for queue notification operation.
/// </summary>
public sealed record QueueNotificationResponse(
    Guid NotificationId,
    string Status
);
