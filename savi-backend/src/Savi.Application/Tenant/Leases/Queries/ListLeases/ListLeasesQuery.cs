using MediatR;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.ListLeases;

/// <summary>
/// Query to list all leases in the community with filtering and pagination.
/// </summary>
public record ListLeasesQuery(
    LeaseStatus? Status = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<LeaseSummaryDto>>>;
