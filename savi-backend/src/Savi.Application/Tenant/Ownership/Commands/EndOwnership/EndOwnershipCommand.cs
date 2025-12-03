using MediatR;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Commands.EndOwnership;

/// <summary>
/// Command to end a specific ownership record.
/// Used when one co-owner exits but others remain.
/// </summary>
public record EndOwnershipCommand(
    Guid OwnershipId,
    DateOnly EndDate
) : IRequest<Result>;
