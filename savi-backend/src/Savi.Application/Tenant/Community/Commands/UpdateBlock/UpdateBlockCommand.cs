using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.UpdateBlock;
/// <summary>
/// Command to update an existing block.
/// </summary>
public record UpdateBlockCommand(
    Guid Id,
    string Name,
    string? Description,
    int DisplayOrder
) : IRequest<Result>;
