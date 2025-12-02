using MediatR;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Commands.CreateBlock;
/// <summary>
/// Command to create a new block (building/tower) in the community.
/// </summary>
public record CreateBlockCommand(
    string Name,
    string? Description,
    int DisplayOrder
) : IRequest<Result<Guid>>;
