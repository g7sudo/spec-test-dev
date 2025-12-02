using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Community.Parties.Dtos;

/// <summary>
/// DTO for Party entity.
/// </summary>
public record PartyDto
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Display name (e.g. "John Doe", "ABC Real Estate LLC").
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Registered legal name if different from display name.
    /// </summary>
    public string? LegalName { get; init; }

    // Individual-specific fields

    /// <summary>
    /// First name (for individuals).
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Last name (for individuals).
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Date of birth (for individuals).
    /// </summary>
    public DateOnly? DateOfBirth { get; init; }

    // Company/Entity-specific fields

    /// <summary>
    /// Business registration number (for companies/entities).
    /// </summary>
    public string? RegistrationNumber { get; init; }

    /// <summary>
    /// Tax identification number (for companies/entities).
    /// </summary>
    public string? TaxNumber { get; init; }

    /// <summary>
    /// Additional notes about the party.
    /// </summary>
    public string? Notes { get; init; }

    /// <summary>
    /// Whether the party is active.
    /// </summary>
    public bool IsActive { get; init; }

    /// <summary>
    /// When the party was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the party was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; init; }

    /// <summary>
    /// Addresses associated with this party.
    /// Only included when fetching single party details.
    /// </summary>
    public List<PartyAddressDto>? Addresses { get; init; }

    /// <summary>
    /// Contacts associated with this party.
    /// Only included when fetching single party details.
    /// </summary>
    public List<PartyContactDto>? Contacts { get; init; }
}

