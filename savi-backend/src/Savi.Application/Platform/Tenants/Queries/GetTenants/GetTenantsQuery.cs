using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.GetTenants;

/// <summary>
/// Query to retrieve a paginated list of tenants.
/// </summary>
public sealed record GetTenantsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    TenantStatus? Status = null,
    bool? IsActive = null
) : IRequest<Result<PagedResult<TenantSummaryDto>>>;
