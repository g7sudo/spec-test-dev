namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Type of address for a party.
/// Maps to DBML: Enum PartyAddressType
/// </summary>
public enum PartyAddressType
{
    /// <summary>
    /// Permanent residential address.
    /// </summary>
    Permanent,

    /// <summary>
    /// Address for communications/correspondence.
    /// </summary>
    Communication,

    /// <summary>
    /// Registered business address (for companies/entities).
    /// </summary>
    Registered,

    /// <summary>
    /// Billing address for invoices.
    /// </summary>
    Billing,

    /// <summary>
    /// Other address type.
    /// </summary>
    Other
}

