namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of a visitor pass.
/// Maps to DBML: Enum VisitorPassStatus
/// </summary>
public enum VisitorPassStatus
{
    /// <summary>
    /// Created by resident in advance.
    /// </summary>
    PreRegistered,

    /// <summary>
    /// Created or found at gate, waiting for resident approval.
    /// </summary>
    AtGatePendingApproval,

    /// <summary>
    /// Approved by resident/admin, allowed to enter.
    /// </summary>
    Approved,

    /// <summary>
    /// Explicitly rejected.
    /// </summary>
    Rejected,

    /// <summary>
    /// Visitor has entered.
    /// </summary>
    CheckedIn,

    /// <summary>
    /// Visitor has left.
    /// </summary>
    CheckedOut,

    /// <summary>
    /// Auto-expired (no show / out of time window).
    /// </summary>
    Expired
}
