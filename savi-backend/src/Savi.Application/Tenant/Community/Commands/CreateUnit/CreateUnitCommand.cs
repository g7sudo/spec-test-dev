using MediatR;
using Savi.SharedKernel.Common;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.CreateUnit;
/// <summary>
/// Command to create a new unit (apartment/flat) within a floor.
/// </summary>
public record CreateUnitCommand(
    Guid BlockId,
    Guid FloorId,
    Guid UnitTypeId,
    string UnitNumber,
    decimal? AreaSqft,
    UnitStatus Status,
    string? Notes
) : IRequest<Result<Guid>>;
