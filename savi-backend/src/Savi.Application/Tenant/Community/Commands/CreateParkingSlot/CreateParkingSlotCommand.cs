using MediatR;
using Savi.SharedKernel.Common;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.CreateParkingSlot;
/// <summary>
/// Command to create a new parking slot.
/// </summary>
public record CreateParkingSlotCommand(
    string Code,
    ParkingLocationType LocationType,
    string? LevelLabel,
    bool IsCovered,
    bool IsEVCompatible,
    ParkingStatus Status,
    string? Notes
) : IRequest<Result<Guid>>;
