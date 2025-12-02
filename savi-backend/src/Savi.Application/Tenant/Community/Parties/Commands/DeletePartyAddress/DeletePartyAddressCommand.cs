using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Parties.Commands.DeletePartyAddress;

/// <summary>
/// Command to soft-delete a party address.
/// </summary>
public record DeletePartyAddressCommand(Guid PartyId, Guid AddressId) : IRequest<Result<Unit>>;

