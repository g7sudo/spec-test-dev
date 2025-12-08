namespace Savi.Application.Tenant.Me.Dtos;

/// <summary>
/// DTO for notification settings.
/// </summary>
public record NotificationSettingsDto
{
    /// <summary>
    /// Whether push notifications are enabled.
    /// </summary>
    public bool PushEnabled { get; init; }

    /// <summary>
    /// Whether email notifications are enabled.
    /// </summary>
    public bool EmailEnabled { get; init; }

    /// <summary>
    /// Receive notifications for maintenance request updates.
    /// </summary>
    public bool NotifyMaintenanceUpdates { get; init; }

    /// <summary>
    /// Receive notifications for amenity booking updates.
    /// </summary>
    public bool NotifyAmenityBookings { get; init; }

    /// <summary>
    /// Receive notifications when visitor arrives at gate.
    /// </summary>
    public bool NotifyVisitorAtGate { get; init; }

    /// <summary>
    /// Receive notifications for community announcements.
    /// </summary>
    public bool NotifyAnnouncements { get; init; }

    /// <summary>
    /// Receive notifications for marketplace activity.
    /// </summary>
    public bool NotifyMarketplace { get; init; }
}
