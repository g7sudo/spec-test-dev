using MediatR;
using Savi.SharedKernel.Common;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListUnitTypes;
public record ListUnitTypesQuery(
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<UnitTypeDto>>>;
