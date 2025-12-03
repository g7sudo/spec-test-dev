using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListFloors;

/// <summary>
/// Query to list all floors with optional block filtering and pagination.
/// </summary>
public record ListFloorsQuery(
    Guid? BlockId = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<FloorDto>>>;
