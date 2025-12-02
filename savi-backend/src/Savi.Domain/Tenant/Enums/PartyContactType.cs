namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Type of contact information for a party.
/// Maps to DBML: Enum PartyContactType
/// </summary>
public enum PartyContactType
{
    /// <summary>
    /// Email address.
    /// </summary>
    Email,

    /// <summary>
    /// Mobile phone number.
    /// </summary>
    Mobile,

    /// <summary>
    /// Landline phone number.
    /// </summary>
    Phone,

    /// <summary>
    /// WhatsApp contact number.
    /// </summary>
    Whatsapp,

    /// <summary>
    /// Other contact type.
    /// </summary>
    Other
}

