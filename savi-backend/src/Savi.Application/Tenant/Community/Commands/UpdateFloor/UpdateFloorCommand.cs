using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.UpdateFloor;
/// <summary>
/// Command to update an existing floor.
/// </summary>
public record UpdateFloorCommand(
    Guid Id,
    string Name,
    int LevelNumber,
    int DisplayOrder
) : IRequest<Result>;
