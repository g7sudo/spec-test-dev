using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Parties.Dtos;

/// <summary>
/// DTO for PartyContact entity.
/// </summary>
public record PartyContactDto
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The party this contact belongs to.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Type of contact (Email, Mobile, Phone, WhatsApp, Other).
    /// </summary>
    public PartyContactType ContactType { get; init; }

    /// <summary>
    /// The contact value (email address, phone number, etc.).
    /// </summary>
    public string Value { get; init; } = string.Empty;

    /// <summary>
    /// Whether this is the primary contact of this type for the party.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Whether this contact has been verified.
    /// </summary>
    public bool IsVerified { get; init; }

    /// <summary>
    /// Whether the contact is active.
    /// </summary>
    public bool IsActive { get; init; }

    /// <summary>
    /// When the contact was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the contact was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; init; }
}

