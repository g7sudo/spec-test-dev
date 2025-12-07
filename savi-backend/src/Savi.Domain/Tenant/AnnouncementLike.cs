using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a like on an announcement by a community user.
/// Maps to DBML: Table AnnouncementLike
/// </summary>
public class AnnouncementLike : BaseEntity
{
    /// <summary>
    /// Reference to the announcement being liked.
    /// </summary>
    public Guid AnnouncementId { get; private set; }

    /// <summary>
    /// Reference to the community user who liked.
    /// </summary>
    public Guid CommunityUserId { get; private set; }

    // EF Core constructor
    private AnnouncementLike() { }

    /// <summary>
    /// Creates a new like for an announcement.
    /// </summary>
    public static AnnouncementLike Create(Guid announcementId, Guid communityUserId)
    {
        if (announcementId == Guid.Empty)
            throw new ArgumentException("Announcement ID is required.", nameof(announcementId));

        if (communityUserId == Guid.Empty)
            throw new ArgumentException("Community User ID is required.", nameof(communityUserId));

        var like = new AnnouncementLike
        {
            AnnouncementId = announcementId,
            CommunityUserId = communityUserId
        };

        like.SetCreatedBy(communityUserId);
        return like;
    }
}
