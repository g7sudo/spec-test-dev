using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListUnits;
/// <summary>
/// Query to list units with optional filtering by block/floor and pagination.
/// </summary>
public record ListUnitsQuery(
    Guid? BlockId = null,
    Guid? FloorId = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<UnitDto>>>;
