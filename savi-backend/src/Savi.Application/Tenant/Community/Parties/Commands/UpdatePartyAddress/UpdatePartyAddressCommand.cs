using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyAddress;

/// <summary>
/// Command to update an existing party address.
/// </summary>
public record UpdatePartyAddressCommand : IRequest<Result<Unit>>
{
    /// <summary>
    /// ID of the party.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// ID of the address to update.
    /// </summary>
    public Guid AddressId { get; init; }

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
}

