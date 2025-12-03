using MediatR;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Commands.TransferOwnership;

/// <summary>
/// Command to transfer ownership of a unit from current owners to new owners.
/// Ends all current ownerships and creates new ones in a single transaction.
/// </summary>
public record TransferOwnershipCommand(
    Guid UnitId,
    DateOnly TransferDate,
    List<NewOwnerDto> NewOwners
) : IRequest<Result<List<Guid>>>;

/// <summary>
/// DTO for a new owner in a transfer.
/// </summary>
public record NewOwnerDto(
    Guid PartyId,
    decimal OwnershipShare,
    bool IsPrimaryOwner
);
