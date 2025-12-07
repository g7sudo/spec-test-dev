using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.ListMaintenanceRequests;

/// <summary>
/// Handler for ListMaintenanceRequestsQuery.
/// </summary>
public class ListMaintenanceRequestsQueryHandler
    : IRequestHandler<ListMaintenanceRequestsQuery, Result<PagedResult<MaintenanceRequestSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListMaintenanceRequestsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<MaintenanceRequestSummaryDto>>> Handle(
        ListMaintenanceRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(r =>
                r.TicketNumber.ToLower().Contains(searchTerm) ||
                r.Title.ToLower().Contains(searchTerm) ||
                (r.Description != null && r.Description.ToLower().Contains(searchTerm)));
        }

        if (request.UnitId.HasValue)
        {
            query = query.Where(r => r.UnitId == request.UnitId.Value);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(r => r.CategoryId == request.CategoryId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(r => r.Priority == request.Priority.Value);
        }

        if (request.AssignedToUserId.HasValue)
        {
            query = query.Where(r => r.AssignedToUserId == request.AssignedToUserId.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(r => r.RequestedAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(r => r.RequestedAt <= request.ToDate.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results with joins
        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Join(
                _dbContext.Units,
                r => r.UnitId,
                u => u.Id,
                (r, u) => new { Request = r, Unit = u })
            .Join(
                _dbContext.MaintenanceCategories,
                ru => ru.Request.CategoryId,
                c => c.Id,
                (ru, c) => new { ru.Request, ru.Unit, Category = c })
            .GroupJoin(
                _dbContext.CommunityUsers,
                ruc => ruc.Request.AssignedToUserId,
                cu => cu.Id,
                (ruc, assignedUsers) => new { ruc.Request, ruc.Unit, ruc.Category, AssignedUsers = assignedUsers })
            .SelectMany(
                x => x.AssignedUsers.DefaultIfEmpty(),
                (x, assignedUser) => new MaintenanceRequestSummaryDto
                {
                    Id = x.Request.Id,
                    TicketNumber = x.Request.TicketNumber,
                    UnitNumber = x.Unit.UnitNumber,
                    CategoryName = x.Category.Name,
                    Title = x.Request.Title,
                    Status = x.Request.Status,
                    Priority = x.Request.Priority,
                    AssignedToUserName = assignedUser != null ? assignedUser.PreferredName : null,
                    RequestedAt = x.Request.RequestedAt,
                    DueBy = x.Request.DueBy
                })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<MaintenanceRequestSummaryDto>(
            requests,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<MaintenanceRequestSummaryDto>>.Success(result);
    }
}
