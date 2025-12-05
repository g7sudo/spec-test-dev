namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of a resident invitation.
/// Maps to DBML: Enum ResidentInviteStatus (implied from flow documentation)
/// </summary>
public enum ResidentInviteStatus
{
    /// <summary>
    /// Invite has been sent and is awaiting acceptance.
    /// </summary>
    Pending,

    /// <summary>
    /// Invite has been accepted by the resident.
    /// </summary>
    Accepted,

    /// <summary>
    /// Invite has expired (past expiration date without being accepted).
    /// </summary>
    Expired,

    /// <summary>
    /// Invite was cancelled by admin or primary resident.
    /// </summary>
    Cancelled
}
