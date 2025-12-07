namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Categories for user notifications.
/// </summary>
public enum NotificationCategory
{
    /// <summary>
    /// General system notifications.
    /// </summary>
    General = 0,

    /// <summary>
    /// Maintenance request updates.
    /// </summary>
    Maintenance = 1,

    /// <summary>
    /// Amenity booking notifications.
    /// </summary>
    AmenityBooking = 2,

    /// <summary>
    /// Visitor arrival notifications.
    /// </summary>
    Visitor = 3,

    /// <summary>
    /// Community announcements.
    /// </summary>
    Announcement = 4,

    /// <summary>
    /// Marketplace related notifications.
    /// </summary>
    Marketplace = 5,

    /// <summary>
    /// Payment and billing notifications.
    /// </summary>
    Payment = 6,

    /// <summary>
    /// Document related notifications.
    /// </summary>
    Document = 7,

    /// <summary>
    /// Security alerts and notifications.
    /// </summary>
    Security = 8
}
