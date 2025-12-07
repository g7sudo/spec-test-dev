using MediatR;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.ListMaintenanceRequests;

/// <summary>
/// Query to list maintenance requests with filtering and pagination.
/// </summary>
public record ListMaintenanceRequestsQuery(
    string? SearchTerm = null,
    Guid? UnitId = null,
    Guid? CategoryId = null,
    MaintenanceStatus? Status = null,
    MaintenancePriority? Priority = null,
    Guid? AssignedToUserId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<MaintenanceRequestSummaryDto>>>;
