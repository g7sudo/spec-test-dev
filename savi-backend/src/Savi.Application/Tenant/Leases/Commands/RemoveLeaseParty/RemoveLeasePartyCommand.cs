using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Commands.RemoveLeaseParty;

/// <summary>
/// Command to remove a party from a lease.
/// </summary>
public record RemoveLeasePartyCommand(Guid LeasePartyId) : IRequest<Result<bool>>;
