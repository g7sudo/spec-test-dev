using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Tracks when a community user has read an announcement.
/// Used for read/unread status and analytics.
/// Maps to DBML: Table AnnouncementRead
/// </summary>
public class AnnouncementRead : BaseEntity
{
    /// <summary>
    /// Reference to the announcement that was read.
    /// </summary>
    public Guid AnnouncementId { get; private set; }

    /// <summary>
    /// Reference to the community user who read the announcement.
    /// </summary>
    public Guid CommunityUserId { get; private set; }

    /// <summary>
    /// Timestamp when the announcement was read.
    /// </summary>
    public DateTime ReadAt { get; private set; }

    // EF Core constructor
    private AnnouncementRead() { }

    /// <summary>
    /// Creates a read record for an announcement.
    /// </summary>
    public static AnnouncementRead Create(Guid announcementId, Guid communityUserId)
    {
        if (announcementId == Guid.Empty)
            throw new ArgumentException("Announcement ID is required.", nameof(announcementId));

        if (communityUserId == Guid.Empty)
            throw new ArgumentException("Community User ID is required.", nameof(communityUserId));

        var read = new AnnouncementRead
        {
            AnnouncementId = announcementId,
            CommunityUserId = communityUserId,
            ReadAt = DateTime.UtcNow
        };

        read.SetCreatedBy(communityUserId);
        return read;
    }
}
