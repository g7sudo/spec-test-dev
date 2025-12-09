using MediatR;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.GetMyRequests;

/// <summary>
/// Query to get maintenance requests for the current user.
/// Respects permission hierarchy: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public record GetMyRequestsQuery(
    MaintenanceStatus? Status = null,
    MaintenancePriority? Priority = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<MaintenanceRequestSummaryDto>>>;
