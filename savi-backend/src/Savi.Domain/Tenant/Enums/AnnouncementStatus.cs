namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Lifecycle status of an announcement.
/// Maps to DBML: Enum AnnouncementStatus
/// </summary>
public enum AnnouncementStatus
{
    /// <summary>
    /// Announcement is being drafted and not yet visible.
    /// </summary>
    Draft,

    /// <summary>
    /// Announcement is scheduled for future publication.
    /// </summary>
    Scheduled,

    /// <summary>
    /// Announcement is published and visible to target audience.
    /// </summary>
    Published,

    /// <summary>
    /// Announcement has been archived and moved to history.
    /// </summary>
    Archived
}
