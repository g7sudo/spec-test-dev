namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Role of a party in a lease agreement.
/// Maps to DBML: Enum LeasePartyRole
/// </summary>
public enum LeasePartyRole
{
    /// <summary>
    /// Primary resident responsible for the lease.
    /// </summary>
    PrimaryResident,

    /// <summary>
    /// Co-resident sharing the unit.
    /// </summary>
    CoResident,

    /// <summary>
    /// Guarantor for the lease (financial responsibility).
    /// </summary>
    Guarantor,

    /// <summary>
    /// Other role not covered by the above.
    /// </summary>
    Other
}
