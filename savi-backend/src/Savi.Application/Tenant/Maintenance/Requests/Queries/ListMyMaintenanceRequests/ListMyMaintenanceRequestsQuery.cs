using MediatR;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.ListMyMaintenanceRequests;

/// <summary>
/// Query to list maintenance requests submitted by the current user.
/// </summary>
public record ListMyMaintenanceRequestsQuery(
    MaintenanceStatus? Status = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<MaintenanceRequestSummaryDto>>>;
