using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.ListMyMaintenanceRequests;

/// <summary>
/// Handler for ListMyMaintenanceRequestsQuery.
/// </summary>
public class ListMyMaintenanceRequestsQueryHandler
    : IRequestHandler<ListMyMaintenanceRequestsQuery, Result<PagedResult<MaintenanceRequestSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ListMyMaintenanceRequestsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<PagedResult<MaintenanceRequestSummaryDto>>> Handle(
        ListMyMaintenanceRequestsQuery request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<PagedResult<MaintenanceRequestSummaryDto>>.Failure(
                "User does not exist in the current tenant.");
        }

        var query = _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.IsActive && r.RequestedByUserId == _currentUser.TenantUserId.Value);

        // Apply status filter
        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
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
