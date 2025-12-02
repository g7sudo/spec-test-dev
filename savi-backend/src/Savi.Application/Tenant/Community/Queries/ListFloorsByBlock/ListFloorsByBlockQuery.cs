using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListFloorsByBlock;
/// <summary>
/// Query to list all floors for a specific block with pagination.
/// </summary>
public record ListFloorsByBlockQuery(
    Guid BlockId,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<FloorDto>>>;
