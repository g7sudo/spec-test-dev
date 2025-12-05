using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Leases.Queries.ListLeases;

/// <summary>
/// Handler for ListLeasesQuery - lists all leases in the community.
/// </summary>
public class ListLeasesQueryHandler
    : IRequestHandler<ListLeasesQuery, Result<PagedResult<LeaseSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListLeasesQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<LeaseSummaryDto>>> Handle(
        ListLeasesQuery request,
        CancellationToken cancellationToken)
    {
        // Base query - all active leases
        var query = _dbContext.Leases
            .AsNoTracking()
            .Where(l => l.IsActive);

        // Apply status filter
        if (request.Status.HasValue)
        {
            query = query.Where(l => l.Status == request.Status.Value);
        }

        // Apply search filter (unit number or resident name)
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();

            // Get unit IDs matching the search term
            var matchingUnitIds = await _dbContext.Units
                .AsNoTracking()
                .Where(u => u.IsActive && u.UnitNumber.ToLower().Contains(searchTerm))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            // Get lease IDs with matching primary resident names
            var matchingLeaseIdsByResident = await _dbContext.LeaseParties
                .AsNoTracking()
                .Where(lp => lp.IsActive && lp.IsPrimary)
                .Join(
                    _dbContext.Parties.Where(p => p.IsActive && p.PartyName != null && p.PartyName.ToLower().Contains(searchTerm)),
                    lp => lp.PartyId,
                    p => p.Id,
                    (lp, p) => lp.LeaseId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Filter leases by matching unit IDs or lease IDs
            query = query.Where(l =>
                matchingUnitIds.Contains(l.UnitId) ||
                matchingLeaseIdsByResident.Contains(l.Id));
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var leases = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (leases.Count == 0)
        {
            return Result<PagedResult<LeaseSummaryDto>>.Success(
                new PagedResult<LeaseSummaryDto>(
                    Array.Empty<LeaseSummaryDto>(),
                    request.Page,
                    request.PageSize,
                    totalCount));
        }

        var leaseIds = leases.Select(l => l.Id).ToList();
        var unitIds = leases.Select(l => l.UnitId).Distinct().ToList();

        // Get unit info for all leases
        var unitInfos = await _dbContext.Units
            .AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.UnitNumber,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == u.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault()
            })
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        // Get primary resident names for each lease
        var primaryResidents = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => leaseIds.Contains(lp.LeaseId) && lp.IsActive && lp.IsPrimary)
            .Join(
                _dbContext.Parties,
                lp => lp.PartyId,
                p => p.Id,
                (lp, p) => new { lp.LeaseId, p.PartyName })
            .ToDictionaryAsync(x => x.LeaseId, x => x.PartyName, cancellationToken);

        // Get party counts
        var partyCounts = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => leaseIds.Contains(lp.LeaseId) && lp.IsActive)
            .GroupBy(lp => lp.LeaseId)
            .Select(g => new { LeaseId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LeaseId, x => x.Count, cancellationToken);

        var items = leases.Select(l =>
        {
            var unitInfo = unitInfos.GetValueOrDefault(l.UnitId);
            return new LeaseSummaryDto
            {
                Id = l.Id,
                UnitId = l.UnitId,
                UnitNumber = unitInfo?.UnitNumber ?? string.Empty,
                BlockName = unitInfo?.BlockName,
                Status = l.Status,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                PrimaryResidentName = primaryResidents.GetValueOrDefault(l.Id),
                PartyCount = partyCounts.GetValueOrDefault(l.Id, 0),
                MonthlyRent = l.MonthlyRent,
                CreatedAt = l.CreatedAt
            };
        }).ToList();

        var result = new PagedResult<LeaseSummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<LeaseSummaryDto>>.Success(result);
    }
}
