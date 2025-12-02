using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a contact point associated with a party.
/// Multiple contact points (email, mobile, phone, WhatsApp) per party.
/// Maps to DBML: Table PartyContact
/// </summary>
public class PartyContact : BaseEntity
{
    /// <summary>
    /// The party this contact belongs to.
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Type of contact (Email, Mobile, Phone, WhatsApp, Other).
    /// </summary>
    public PartyContactType ContactType { get; private set; }

    /// <summary>
    /// The contact value (email address, phone number, etc.).
    /// </summary>
    public string Value { get; private set; } = string.Empty;

    /// <summary>
    /// Whether this is the primary contact of this type for the party.
    /// </summary>
    public bool IsPrimary { get; private set; }

    /// <summary>
    /// Whether this contact has been verified.
    /// </summary>
    public bool IsVerified { get; private set; }

    // EF Core constructor
    private PartyContact() { }

    /// <summary>
    /// Creates a new contact for a party.
    /// </summary>
    public static PartyContact Create(
        Guid partyId,
        PartyContactType contactType,
        string value,
        bool isPrimary,
        Guid? createdBy)
    {
        var contact = new PartyContact
        {
            PartyId = partyId,
            ContactType = contactType,
            Value = value,
            IsPrimary = isPrimary,
            IsVerified = false
        };

        contact.SetCreatedBy(createdBy);
        return contact;
    }

    /// <summary>
    /// Updates the contact details.
    /// </summary>
    public void Update(
        PartyContactType contactType,
        string value,
        bool isPrimary,
        Guid? updatedBy)
    {
        ContactType = contactType;
        Value = value;
        IsPrimary = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Marks this contact as verified.
    /// </summary>
    public void MarkAsVerified(Guid? updatedBy)
    {
        IsVerified = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Removes verification status (e.g., when contact value changes).
    /// </summary>
    public void RemoveVerification(Guid? updatedBy)
    {
        IsVerified = false;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets this contact as the primary contact.
    /// </summary>
    public void SetAsPrimary(Guid? updatedBy)
    {
        IsPrimary = true;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Removes the primary status from this contact.
    /// </summary>
    public void RemovePrimaryStatus(Guid? updatedBy)
    {
        IsPrimary = false;
        MarkAsUpdated(updatedBy);
    }
}

