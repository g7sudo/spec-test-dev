using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.ListLeasesByUnit;

/// <summary>
/// Handler for ListLeasesByUnitQuery.
/// </summary>
public class ListLeasesByUnitQueryHandler
    : IRequestHandler<ListLeasesByUnitQuery, Result<PagedResult<LeaseSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListLeasesByUnitQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<LeaseSummaryDto>>> Handle(
        ListLeasesByUnitQuery request,
        CancellationToken cancellationToken)
    {
        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<PagedResult<LeaseSummaryDto>>.Failure(
                $"Unit with ID '{request.UnitId}' not found.");
        }

        var query = _dbContext.Leases
            .AsNoTracking()
            .Where(l => l.UnitId == request.UnitId && l.IsActive);

        // Apply status filter
        if (request.Status.HasValue)
        {
            query = query.Where(l => l.Status == request.Status.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get unit info
        var unitInfo = await _dbContext.Units
            .AsNoTracking()
            .Where(u => u.Id == request.UnitId)
            .Select(u => new
            {
                u.UnitNumber,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == u.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Get paginated results
        var leases = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Get primary resident names for each lease
        var leaseIds = leases.Select(l => l.Id).ToList();
        var primaryResidents = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => leaseIds.Contains(lp.LeaseId) && lp.IsActive && lp.IsPrimary)
            .Join(
                _dbContext.Parties,
                lp => lp.PartyId,
                p => p.Id,
                (lp, p) => new { lp.LeaseId, p.PartyName })
            .ToListAsync(cancellationToken);

        // Get party counts
        var partyCounts = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => leaseIds.Contains(lp.LeaseId) && lp.IsActive)
            .GroupBy(lp => lp.LeaseId)
            .Select(g => new { LeaseId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var items = leases.Select(l => new LeaseSummaryDto
        {
            Id = l.Id,
            UnitId = l.UnitId,
            UnitNumber = unitInfo?.UnitNumber ?? string.Empty,
            BlockName = unitInfo?.BlockName,
            Status = l.Status,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            PrimaryResidentName = primaryResidents.FirstOrDefault(pr => pr.LeaseId == l.Id)?.PartyName,
            PartyCount = partyCounts.FirstOrDefault(pc => pc.LeaseId == l.Id)?.Count ?? 0,
            MonthlyRent = l.MonthlyRent,
            CreatedAt = l.CreatedAt
        }).ToList();

        var result = new PagedResult<LeaseSummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<LeaseSummaryDto>>.Success(result);
    }
}
