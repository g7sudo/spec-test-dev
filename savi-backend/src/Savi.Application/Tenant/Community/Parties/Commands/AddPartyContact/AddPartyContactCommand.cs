using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.AddPartyContact;

/// <summary>
/// Command to add a contact to a party.
/// </summary>
public record AddPartyContactCommand : IRequest<Result<Guid>>
{
    /// <summary>
    /// ID of the party to add the contact to.
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
    /// Whether this is the primary contact for the party.
    /// </summary>
    public bool IsPrimary { get; init; }
}

