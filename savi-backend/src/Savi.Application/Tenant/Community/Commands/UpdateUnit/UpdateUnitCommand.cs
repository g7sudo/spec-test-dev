using MediatR;
using Savi.SharedKernel.Common;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnit;
/// <summary>
/// Command to update an existing unit.
/// </summary>
public record UpdateUnitCommand(
    Guid Id,
    Guid UnitTypeId,
    string UnitNumber,
    decimal? AreaSqft,
    UnitStatus Status,
    string? Notes
) : IRequest<Result>;
