using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.DeallocateParkingSlot;
/// <summary>
/// Command to deallocate a parking slot from a unit.
/// </summary>
public record DeallocateParkingSlotCommand(Guid ParkingSlotId) : IRequest<Result>;
