using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a comment on an announcement by a community user.
/// Maps to DBML: Table AnnouncementComment
/// </summary>
public class AnnouncementComment : BaseEntity
{
    /// <summary>
    /// Reference to the announcement being commented on.
    /// </summary>
    public Guid AnnouncementId { get; private set; }

    /// <summary>
    /// Reference to the community user who commented.
    /// </summary>
    public Guid CommunityUserId { get; private set; }

    /// <summary>
    /// The comment text content.
    /// </summary>
    public string Content { get; private set; } = string.Empty;

    /// <summary>
    /// Whether the comment has been hidden by moderator.
    /// </summary>
    public bool IsHidden { get; private set; }

    /// <summary>
    /// Reference to parent comment for threaded replies (optional).
    /// </summary>
    public Guid? ParentCommentId { get; private set; }

    // EF Core constructor
    private AnnouncementComment() { }

    /// <summary>
    /// Creates a new comment on an announcement.
    /// </summary>
    public static AnnouncementComment Create(
        Guid announcementId,
        Guid communityUserId,
        string content,
        Guid? parentCommentId = null)
    {
        if (announcementId == Guid.Empty)
            throw new ArgumentException("Announcement ID is required.", nameof(announcementId));

        if (communityUserId == Guid.Empty)
            throw new ArgumentException("Community User ID is required.", nameof(communityUserId));

        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Comment content is required.", nameof(content));

        var comment = new AnnouncementComment
        {
            AnnouncementId = announcementId,
            CommunityUserId = communityUserId,
            Content = content,
            IsHidden = false,
            ParentCommentId = parentCommentId
        };

        comment.SetCreatedBy(communityUserId);
        return comment;
    }

    /// <summary>
    /// Updates the comment content.
    /// </summary>
    public void Update(string content, Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Comment content is required.", nameof(content));

        Content = content;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Hides the comment (moderation action).
    /// </summary>
    public void Hide(Guid moderatorId)
    {
        IsHidden = true;
        MarkAsUpdated(moderatorId);
    }

    /// <summary>
    /// Shows a previously hidden comment (moderation action).
    /// </summary>
    public void Show(Guid moderatorId)
    {
        IsHidden = false;
        MarkAsUpdated(moderatorId);
    }
}
