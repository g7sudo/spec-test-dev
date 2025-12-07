using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Categories.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Queries.ListMaintenanceCategories;

/// <summary>
/// Handler for ListMaintenanceCategoriesQuery.
/// </summary>
public class ListMaintenanceCategoriesQueryHandler
    : IRequestHandler<ListMaintenanceCategoriesQuery, Result<PagedResult<MaintenanceCategorySummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListMaintenanceCategoriesQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<MaintenanceCategorySummaryDto>>> Handle(
        ListMaintenanceCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.MaintenanceCategories
            .AsNoTracking()
            .Where(c => c.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(searchTerm) ||
                (c.Code != null && c.Code.ToLower().Contains(searchTerm)) ||
                (c.Description != null && c.Description.ToLower().Contains(searchTerm)));
        }

        if (request.IsDefault.HasValue)
        {
            query = query.Where(c => c.IsDefault == request.IsDefault.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var categories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new MaintenanceCategorySummaryDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                DisplayOrder = c.DisplayOrder,
                IsDefault = c.IsDefault
            })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<MaintenanceCategorySummaryDto>(
            categories,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<MaintenanceCategorySummaryDto>>.Success(result);
    }
}
