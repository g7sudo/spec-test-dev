namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Category classification for announcements.
/// Maps to DBML: Enum AnnouncementCategory
/// </summary>
public enum AnnouncementCategory
{
    /// <summary>
    /// General community announcements.
    /// </summary>
    General,

    /// <summary>
    /// Maintenance-related announcements (water outage, elevator maintenance, etc.).
    /// </summary>
    Maintenance,

    /// <summary>
    /// Emergency announcements requiring immediate attention.
    /// </summary>
    Emergency,

    /// <summary>
    /// Event announcements (community gatherings, festivals, meetings).
    /// </summary>
    Event,

    /// <summary>
    /// Safety and security related announcements.
    /// </summary>
    Safety,

    /// <summary>
    /// Policy updates and community rules.
    /// </summary>
    Policy
}
