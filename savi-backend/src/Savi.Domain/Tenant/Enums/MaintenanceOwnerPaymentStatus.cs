namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of owner payment for approved maintenance work.
/// Maps to DBML: Enum MaintenanceOwnerPaymentStatus
/// </summary>
public enum MaintenanceOwnerPaymentStatus
{
    /// <summary>
    /// No charge to owner (internal/community-funded work).
    /// </summary>
    NotRequired,

    /// <summary>
    /// Owner needs to pay, not yet paid.
    /// </summary>
    Pending,

    /// <summary>
    /// Fully paid by owner.
    /// </summary>
    Paid,

    /// <summary>
    /// Payment written off / waived by community.
    /// </summary>
    Waived
}
