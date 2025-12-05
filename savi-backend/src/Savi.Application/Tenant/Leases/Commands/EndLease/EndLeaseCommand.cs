using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Commands.EndLease;

/// <summary>
/// Command to end an active lease.
/// </summary>
public record EndLeaseCommand(
    Guid LeaseId,
    string? TerminationReason
) : IRequest<Result<Guid>>;
