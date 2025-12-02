using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeleteParty;

/// <summary>
/// Command to soft-delete a party.
/// </summary>
public record DeletePartyCommand(Guid Id) : IRequest<Result<Unit>>;

