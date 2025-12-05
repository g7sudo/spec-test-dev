using MediatR;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.ListLeasesByUnit;

/// <summary>
/// Query to list leases for a unit with optional status filter.
/// </summary>
public record ListLeasesByUnitQuery(
    Guid UnitId,
    LeaseStatus? Status = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<LeaseSummaryDto>>>;
