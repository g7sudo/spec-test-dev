using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeletePartyContact;

/// <summary>
/// Command to soft-delete a party contact.
/// </summary>
public record DeletePartyContactCommand(Guid PartyId, Guid ContactId) : IRequest<Result<Unit>>;

