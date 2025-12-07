namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Source type indicating where the notification originated from.
/// </summary>
public enum NotificationSourceType
{
    /// <summary>
    /// Notification originated from the platform (e.g., system announcements).
    /// </summary>
    Platform,

    /// <summary>
    /// Notification originated from a tenant (e.g., community announcements).
    /// </summary>
    Tenant
}
