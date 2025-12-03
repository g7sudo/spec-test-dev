using MediatR;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Commands.CreateUnitOwnership;

/// <summary>
/// Command to create a new unit ownership record.
/// Used for adding first owner or joint owner.
/// </summary>
public record CreateUnitOwnershipCommand(
    Guid UnitId,
    Guid PartyId,
    decimal OwnershipShare,
    DateOnly FromDate,
    bool IsPrimaryOwner
) : IRequest<Result<Guid>>;
