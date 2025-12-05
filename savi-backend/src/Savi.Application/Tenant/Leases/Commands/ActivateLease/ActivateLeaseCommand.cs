using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Commands.ActivateLease;

/// <summary>
/// Command to activate a draft lease.
/// </summary>
public record ActivateLeaseCommand(Guid LeaseId) : IRequest<Result<Guid>>;
