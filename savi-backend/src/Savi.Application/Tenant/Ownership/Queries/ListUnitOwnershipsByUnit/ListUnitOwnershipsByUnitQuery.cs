using MediatR;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByUnit;

/// <summary>
/// Query to list all ownerships for a specific unit.
/// Returns both current and historical ownership records.
/// </summary>
public record ListUnitOwnershipsByUnitQuery(
    Guid UnitId,
    bool CurrentOnly = false,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<UnitOwnershipDto>>>;
