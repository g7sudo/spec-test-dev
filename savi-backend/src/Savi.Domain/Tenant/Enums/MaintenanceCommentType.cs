namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Type of comment on a maintenance request.
/// Maps to DBML: Enum MaintenanceCommentType
/// </summary>
public enum MaintenanceCommentType
{
    ResidentComment,
    OwnerComment,
    StaffPublicReply,
    StaffInternalNote,
    PaymentDiscussion,
    Other
}
