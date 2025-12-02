using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.UpdatePartyContact;

/// <summary>
/// Command to update an existing party contact.
/// </summary>
public record UpdatePartyContactCommand : IRequest<Result<Unit>>
{
    /// <summary>
    /// ID of the party.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// ID of the contact to update.
    /// </summary>
    public Guid ContactId { get; init; }

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

