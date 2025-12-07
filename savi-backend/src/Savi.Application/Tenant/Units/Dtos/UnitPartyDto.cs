using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Units.Dtos;

/// <summary>
/// DTO representing a party (resident or owner) associated with a unit.
/// </summary>
public record UnitPartyDto
{
    /// <summary>
    /// The unique identifier of the party.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// The display name of the party.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// The type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// The association type with the unit (Resident, Owner).
    /// </summary>
    public string AssociationType { get; init; } = string.Empty;

    /// <summary>
    /// The specific role (e.g., PrimaryResident, CoResident for residents; PrimaryOwner for owners).
    /// </summary>
    public string Role { get; init; } = string.Empty;

    /// <summary>
    /// Whether this is the primary party for the association type.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Primary email contact if available.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Primary phone contact if available.
    /// </summary>
    public string? Phone { get; init; }
}
