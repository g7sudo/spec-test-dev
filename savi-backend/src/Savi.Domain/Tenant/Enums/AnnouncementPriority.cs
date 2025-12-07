namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Priority level for announcements.
/// Maps to DBML: Enum AnnouncementPriority
/// </summary>
public enum AnnouncementPriority
{
    /// <summary>
    /// Normal priority - standard announcements.
    /// </summary>
    Normal,

    /// <summary>
    /// Important priority - highlighted in the list.
    /// </summary>
    Important,

    /// <summary>
    /// Critical priority - urgent announcements requiring immediate attention.
    /// </summary>
    Critical
}
