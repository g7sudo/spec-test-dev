using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Visitors.Queries.GetMyVisitors;

/// <summary>
/// Handler for GetMyVisitorsQuery.
/// Applies permission-based filtering: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public class GetMyVisitorsQueryHandler
    : IRequestHandler<GetMyVisitorsQuery, Result<PagedResult<VisitorPassSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;

    public GetMyVisitorsQueryHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
    }

    public async Task<Result<PagedResult<VisitorPassSummaryDto>>> Handle(
        GetMyVisitorsQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetVisitorPassAccess();

        // User must have at least one view permission
        if (!access.CanViewAll && !access.CanViewUnit && !access.CanViewOwn)
        {
            return Result<PagedResult<VisitorPassSummaryDto>>.Failure("User does not have permission to view visitor passes.");
        }

        var query = _dbContext.VisitorPasses
            .AsNoTracking()
            .Where(v => v.IsActive);

        // Apply permission-based filter
        if (access.CanViewAll)
        {
            // No additional filter - user can see all visitor passes
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
                    query = query.Where(v => v.CreatedBy == access.CurrentTenantUserId.Value);
                }
                else
                {
                    return Result<PagedResult<VisitorPassSummaryDto>>.Success(
                        new PagedResult<VisitorPassSummaryDto>(
                            Array.Empty<VisitorPassSummaryDto>(),
                            request.Page,
                            request.PageSize,
                            0));
                }
            }
            else
            {
                query = query.Where(v => userUnitIds.Contains(v.UnitId));
            }
        }
        else if (access.CanViewOwn)
        {
            // Filter by current user only (passes they created)
            if (!access.CurrentTenantUserId.HasValue)
            {
                return Result<PagedResult<VisitorPassSummaryDto>>.Failure("User context not available.");
            }
            query = query.Where(v => v.CreatedBy == access.CurrentTenantUserId.Value);
        }

        // Apply additional filters
        if (request.Status.HasValue)
        {
            query = query.Where(v => v.Status == request.Status.Value);
        }

        if (request.VisitType.HasValue)
        {
            query = query.Where(v => v.VisitType == request.VisitType.Value);
        }

        // Filter by expected visit date (ExpectedFrom), not creation date
        // This allows filtering for "today's visitors", "past visitors", etc.
        if (request.FromDate.HasValue)
        {
            query = query.Where(v => v.ExpectedFrom >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(v => v.ExpectedFrom < request.ToDate.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and project to DTO
        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Join(
                _dbContext.Units.AsNoTracking(),
                v => v.UnitId,
                u => u.Id,
                (v, u) => new { Pass = v, Unit = u })
            .GroupJoin(
                _dbContext.Blocks.AsNoTracking(),
                vu => vu.Unit.BlockId,
                b => b.Id,
                (vu, blocks) => new { vu.Pass, vu.Unit, Blocks = blocks })
            .SelectMany(
                x => x.Blocks.DefaultIfEmpty(),
                (x, block) => new VisitorPassSummaryDto
                {
                    Id = x.Pass.Id,
                    UnitNumber = x.Unit.UnitNumber,
                    BlockName = block != null ? block.Name : null,
                    VisitType = x.Pass.VisitType,
                    Source = x.Pass.Source,
                    AccessCode = x.Pass.AccessCode,
                    VisitorName = x.Pass.VisitorName,
                    VisitorPhone = x.Pass.VisitorPhone,
                    DeliveryProvider = x.Pass.DeliveryProvider,
                    ExpectedFrom = x.Pass.ExpectedFrom,
                    ExpectedTo = x.Pass.ExpectedTo,
                    CheckInAt = x.Pass.CheckInAt,
                    CheckOutAt = x.Pass.CheckOutAt,
                    Status = x.Pass.Status,
                    CreatedAt = x.Pass.CreatedAt
                })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<VisitorPassSummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<VisitorPassSummaryDto>>.Success(result);
    }
}
