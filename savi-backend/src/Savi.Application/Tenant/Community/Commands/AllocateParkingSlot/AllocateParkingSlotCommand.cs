using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.AllocateParkingSlot;
/// <summary>
/// Command to allocate a parking slot to a unit.
/// </summary>
public record AllocateParkingSlotCommand(
    Guid ParkingSlotId,
    Guid UnitId
) : IRequest<Result>;
