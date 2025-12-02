using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Parties.Dtos;

/// <summary>
/// DTO for PartyAddress entity.
/// </summary>
public record PartyAddressDto
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The party this address belongs to.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Type of address (Permanent, Communication, Registered, Billing, Other).
    /// </summary>
    public PartyAddressType AddressType { get; init; }

    /// <summary>
    /// Primary address line (street address, building, etc.).
    /// </summary>
    public string Line1 { get; init; } = string.Empty;

    /// <summary>
    /// Secondary address line (apartment, suite, etc.).
    /// </summary>
    public string? Line2 { get; init; }

    /// <summary>
    /// City name.
    /// </summary>
    public string? City { get; init; }

    /// <summary>
    /// State or province.
    /// </summary>
    public string? State { get; init; }

    /// <summary>
    /// Country name.
    /// </summary>
    public string? Country { get; init; }

    /// <summary>
    /// Postal or ZIP code.
    /// </summary>
    public string? PostalCode { get; init; }

    /// <summary>
    /// Whether this is the primary address for the party.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Whether the address is active.
    /// </summary>
    public bool IsActive { get; init; }

    /// <summary>
    /// When the address was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the address was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; init; }
}

