using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.CreateParty;

/// <summary>
/// Command to create a new party (individual, company, or entity).
/// </summary>
public record CreatePartyCommand : IRequest<Result<Guid>>
{
    /// <summary>
    /// Type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Display name (e.g. "John Doe", "ABC Real Estate LLC").
    /// Required for all party types.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Registered legal name if different from display name.
    /// </summary>
    public string? LegalName { get; init; }

    // Individual-specific fields

    /// <summary>
    /// First name (required for individuals).
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Last name (required for individuals).
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
}

