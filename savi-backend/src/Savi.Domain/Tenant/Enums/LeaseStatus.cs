namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of a lease agreement.
/// Maps to DBML: Enum LeaseStatus
/// </summary>
public enum LeaseStatus
{
    /// <summary>
    /// Lease is being drafted, not yet active.
    /// </summary>
    Draft,

    /// <summary>
    /// Lease is active and in effect.
    /// </summary>
    Active,

    /// <summary>
    /// Lease has ended normally (reached end date or mutually ended).
    /// </summary>
    Ended,

    /// <summary>
    /// Lease was terminated early.
    /// </summary>
    Terminated
}
