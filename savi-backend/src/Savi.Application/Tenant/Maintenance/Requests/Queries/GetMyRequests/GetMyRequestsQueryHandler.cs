using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.GetMyRequests;

/// <summary>
/// Handler for GetMyRequestsQuery.
/// Applies permission-based filtering: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public class GetMyRequestsQueryHandler
    : IRequestHandler<GetMyRequestsQuery, Result<PagedResult<MaintenanceRequestSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;

    public GetMyRequestsQueryHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
    }

    public async Task<Result<PagedResult<MaintenanceRequestSummaryDto>>> Handle(
        GetMyRequestsQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetMaintenanceRequestAccess();

        // User must have at least one view permission
        if (!access.CanViewAll && !access.CanViewUnit && !access.CanViewOwn)
        {
            return Result<PagedResult<MaintenanceRequestSummaryDto>>.Failure("User does not have permission to view maintenance requests.");
        }

        var query = _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.IsActive);

        // Apply permission-based filter
        if (access.CanViewAll)
        {
            // No additional filter - user can see all maintenance requests
        }
        else if (access.CanViewUnit)
        {
            // Filter by user's units
            var userUnitIds = await _ownershipChecker.GetUserUnitIdsAsync(cancellationToken);
            if (userUnitIds.Count == 0)
            {
                // User has unit permission but no units - return own only
                if (access.CurrentTenantUserId.HasValue)
                {
                    query = query.Where(r => r.RequestedByUserId == access.CurrentTenantUserId.Value);
                }
                else
                {
                    return Result<PagedResult<MaintenanceRequestSummaryDto>>.Success(
                        new PagedResult<MaintenanceRequestSummaryDto>(
                            Array.Empty<MaintenanceRequestSummaryDto>(),
                            request.Page,
                            request.PageSize,
                            0));
                }
            }
            else
            {
                query = query.Where(r => userUnitIds.Contains(r.UnitId));
            }
        }
        else if (access.CanViewOwn)
        {
            // Filter by current user only (requests they submitted)
            if (!access.CurrentTenantUserId.HasValue)
            {
                return Result<PagedResult<MaintenanceRequestSummaryDto>>.Failure("User context not available.");
            }
            query = query.Where(r => r.RequestedByUserId == access.CurrentTenantUserId.Value);
        }

        // Apply additional filters
        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(r => r.Priority == request.Priority.Value);
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
