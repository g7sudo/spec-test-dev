using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents an address associated with a party.
/// Multiple addresses per party (permanent, communication, registered, etc.).
/// Maps to DBML: Table PartyAddress
/// </summary>
public class PartyAddress : BaseEntity
{
    /// <summary>
    /// The party this address belongs to.
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Type of address (Permanent, Communication, Registered, Billing, Other).
    /// </summary>
    public PartyAddressType AddressType { get; private set; }

    /// <summary>
    /// Primary address line (street address, building, etc.).
    /// </summary>
    public string Line1 { get; private set; } = string.Empty;

    /// <summary>
    /// Secondary address line (apartment, suite, etc.).
    /// </summary>
    public string? Line2 { get; private set; }

    /// <summary>
    /// City name.
    /// </summary>
    public string? City { get; private set; }

    /// <summary>
    /// State or province.
    /// </summary>
    public string? State { get; private set; }

    /// <summary>
    /// Country name.
    /// </summary>
    public string? Country { get; private set; }

    /// <summary>
    /// Postal or ZIP code.
    /// </summary>
    public string? PostalCode { get; private set; }

    /// <summary>
    /// Whether this is the primary address for the party.
    /// </summary>
    public bool IsPrimary { get; private set; }

    // EF Core constructor
    private PartyAddress() { }

    /// <summary>
    /// Creates a new address for a party.
    /// </summary>
    public static PartyAddress Create(
        Guid partyId,
        PartyAddressType addressType,
        string line1,
        string? line2,
        string? city,
        string? state,
        string? country,
        string? postalCode,
        bool isPrimary,
        Guid? createdBy)
    {
        var address = new PartyAddress
        {
            PartyId = partyId,
            AddressType = addressType,
            Line1 = line1,
            Line2 = line2,
            City = city,
            State = state,
            Country = country,
            PostalCode = postalCode,
            IsPrimary = isPrimary
        };

        address.SetCreatedBy(createdBy);
        return address;
    }

    /// <summary>
    /// Updates the address details.
    /// </summary>
    public void Update(
        PartyAddressType addressType,
        string line1,
        string? line2,
        string? city,
        string? state,
        string? country,
        string? postalCode,
        bool isPrimary,
        Guid? updatedBy)
    {
        AddressType = addressType;
        Line1 = line1;
        Line2 = line2;
        City = city;
        State = state;
        Country = country;
        PostalCode = postalCode;
        IsPrimary = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets this address as the primary address.
    /// </summary>
    public void SetAsPrimary(Guid? updatedBy)
    {
        IsPrimary = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Removes the primary status from this address.
    /// </summary>
    public void RemovePrimaryStatus(Guid? updatedBy)
    {
        IsPrimary = false;
        MarkAsUpdated(updatedBy);
    }
}

