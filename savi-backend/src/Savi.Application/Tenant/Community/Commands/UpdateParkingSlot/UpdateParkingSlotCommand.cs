using MediatR;
using Savi.SharedKernel.Common;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.UpdateParkingSlot;
/// <summary>
/// Command to update an existing parking slot.
/// </summary>
public record UpdateParkingSlotCommand(
    Guid Id,
    string Code,
    ParkingLocationType LocationType,
    string? LevelLabel,
    bool IsCovered,
    bool IsEVCompatible,
    string? Notes
) : IRequest<Result>;
