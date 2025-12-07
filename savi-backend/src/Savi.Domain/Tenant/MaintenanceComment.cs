using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Conversation on a maintenance request. Some comments are internal-only, others visible to residents/owners.
/// Maps to DBML: Table MaintenanceComment
/// </summary>
public class MaintenanceComment : BaseEntity
{
    /// <summary>
    /// The maintenance request this comment belongs to.
    /// </summary>
    public Guid MaintenanceRequestId { get; private set; }

    /// <summary>
    /// Type of comment.
    /// </summary>
    public MaintenanceCommentType CommentType { get; private set; }

    /// <summary>
    /// The comment message content.
    /// </summary>
    public string Message { get; private set; } = string.Empty;

    /// <summary>
    /// Whether this comment is visible to residents.
    /// </summary>
    public bool IsVisibleToResident { get; private set; }

    /// <summary>
    /// Whether this comment is visible to owners.
    /// </summary>
    public bool IsVisibleToOwner { get; private set; }

    // EF Core constructor
    private MaintenanceComment() { }

    /// <summary>
    /// Creates a new maintenance comment.
    /// </summary>
    public static MaintenanceComment Create(
        Guid maintenanceRequestId,
        MaintenanceCommentType commentType,
        string message,
        bool isVisibleToResident,
        bool isVisibleToOwner,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message is required.", nameof(message));

        var comment = new MaintenanceComment
        {
            MaintenanceRequestId = maintenanceRequestId,
            CommentType = commentType,
            Message = message,
            IsVisibleToResident = isVisibleToResident,
            IsVisibleToOwner = isVisibleToOwner
        };

        comment.SetCreatedBy(createdBy);
        return comment;
    }

    /// <summary>
    /// Creates a resident comment (visible to all).
    /// </summary>
    public static MaintenanceComment CreateResidentComment(
        Guid maintenanceRequestId,
        string message,
        Guid createdBy)
    {
        return Create(
            maintenanceRequestId,
            MaintenanceCommentType.ResidentComment,
            message,
            isVisibleToResident: true,
            isVisibleToOwner: true,
            createdBy);
    }

    /// <summary>
    /// Creates an owner comment (visible to all).
    /// </summary>
    public static MaintenanceComment CreateOwnerComment(
        Guid maintenanceRequestId,
        string message,
        Guid createdBy)
    {
        return Create(
            maintenanceRequestId,
            MaintenanceCommentType.OwnerComment,
            message,
            isVisibleToResident: true,
            isVisibleToOwner: true,
            createdBy);
    }

    /// <summary>
    /// Creates a staff public reply (visible to all).
    /// </summary>
    public static MaintenanceComment CreateStaffPublicReply(
        Guid maintenanceRequestId,
        string message,
        Guid createdBy)
    {
        return Create(
            maintenanceRequestId,
            MaintenanceCommentType.StaffPublicReply,
            message,
            isVisibleToResident: true,
            isVisibleToOwner: true,
            createdBy);
    }

    /// <summary>
    /// Creates a staff internal note (not visible to residents/owners).
    /// </summary>
    public static MaintenanceComment CreateStaffInternalNote(
        Guid maintenanceRequestId,
        string message,
        Guid createdBy)
    {
        return Create(
            maintenanceRequestId,
            MaintenanceCommentType.StaffInternalNote,
            message,
            isVisibleToResident: false,
            isVisibleToOwner: false,
            createdBy);
    }

    /// <summary>
    /// Creates a payment discussion comment (visible to owner only).
    /// </summary>
    public static MaintenanceComment CreatePaymentDiscussion(
        Guid maintenanceRequestId,
        string message,
        Guid createdBy)
    {
        return Create(
            maintenanceRequestId,
            MaintenanceCommentType.PaymentDiscussion,
            message,
            isVisibleToResident: false,
            isVisibleToOwner: true,
            createdBy);
    }

    /// <summary>
    /// Updates the comment message.
    /// </summary>
    public void UpdateMessage(string message, Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message is required.", nameof(message));

        Message = message;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the visibility settings.
    /// </summary>
    public void UpdateVisibility(bool isVisibleToResident, bool isVisibleToOwner, Guid updatedBy)
    {
        IsVisibleToResident = isVisibleToResident;
        IsVisibleToOwner = isVisibleToOwner;
        MarkAsUpdated(updatedBy);
    }
}
