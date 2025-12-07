using MediatR;
using Savi.Application.Tenant.Maintenance.Categories.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Queries.ListMaintenanceCategories;

/// <summary>
/// Query to list all maintenance categories with filtering and pagination.
/// </summary>
public record ListMaintenanceCategoriesQuery(
    string? SearchTerm = null,
    bool? IsDefault = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<MaintenanceCategorySummaryDto>>>;
