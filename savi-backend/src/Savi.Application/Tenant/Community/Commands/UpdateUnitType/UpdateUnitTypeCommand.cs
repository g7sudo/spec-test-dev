using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnitType;
public record UpdateUnitTypeCommand(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    int DefaultParkingSlots,
    int? DefaultOccupancyLimit
) : IRequest<Result<Guid>>;
