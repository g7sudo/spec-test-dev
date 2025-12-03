using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Queries.ListOwners;

/// <summary>
/// Handler for listing owners with aggregated ownership information.
/// </summary>
public class ListOwnersQueryHandler
    : IRequestHandler<ListOwnersQuery, Result<PagedResult<OwnerSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListOwnersQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<OwnerSummaryDto>>> Handle(
        ListOwnersQuery request,
        CancellationToken cancellationToken)
    {
        // Get all parties that have ownership records
        var ownershipQuery = _dbContext.UnitOwnerships
            .AsNoTracking()
            .Where(o => o.IsActive);

        if (request.CurrentOwnersOnly)
        {
            ownershipQuery = ownershipQuery.Where(o => o.ToDate == null);
        }

        // Get party IDs that have ownerships
        var partyIdsWithOwnership = ownershipQuery
            .Select(o => o.PartyId)
            .Distinct();

        // Build party query
        var partyQuery = _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.IsActive && partyIdsWithOwnership.Contains(p.Id));

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            partyQuery = partyQuery.Where(p =>
                p.PartyName.ToLower().Contains(searchTerm) ||
                (p.FirstName != null && p.FirstName.ToLower().Contains(searchTerm)) ||
                (p.LastName != null && p.LastName.ToLower().Contains(searchTerm)));
        }

        // Apply party type filter
        if (request.PartyType.HasValue)
        {
            partyQuery = partyQuery.Where(p => p.PartyType == request.PartyType.Value);
        }

        var totalCount = await partyQuery.CountAsync(cancellationToken);

        // Get parties with pagination
        var parties = await partyQuery
            .OrderBy(p => p.PartyName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var partyIds = parties.Select(p => p.Id).ToList();

        // Get ownership counts for these parties
        var ownershipStats = await _dbContext.UnitOwnerships
            .AsNoTracking()
            .Where(o => o.IsActive && partyIds.Contains(o.PartyId))
            .GroupBy(o => o.PartyId)
            .Select(g => new
            {
                PartyId = g.Key,
                ActiveCount = g.Count(o => o.ToDate == null),
                TotalCount = g.Count(),
                LastActivity = g.Max(o => o.UpdatedAt ?? o.CreatedAt)
            })
            .ToListAsync(cancellationToken);

        // Get primary contacts for these parties
        var primaryContacts = await _dbContext.PartyContacts
            .AsNoTracking()
            .Where(c => c.IsActive && partyIds.Contains(c.PartyId) &&
                       (c.ContactType == PartyContactType.Email || c.ContactType == PartyContactType.Mobile))
            .OrderBy(c => c.IsPrimary ? 0 : 1)
            .ThenBy(c => c.ContactType == PartyContactType.Email ? 0 : 1)
            .GroupBy(c => c.PartyId)
            .Select(g => new { PartyId = g.Key, Contact = g.First().Value })
            .ToListAsync(cancellationToken);

        // Check for community user accounts
        var partiesWithAccounts = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.IsActive && partyIds.Contains(cu.PartyId))
            .Select(cu => cu.PartyId)
            .ToListAsync(cancellationToken);

        // Build result
        var items = parties.Select(party =>
        {
            var stats = ownershipStats.FirstOrDefault(s => s.PartyId == party.Id);
            var contact = primaryContacts.FirstOrDefault(c => c.PartyId == party.Id);

            return new OwnerSummaryDto
            {
                PartyId = party.Id,
                PartyName = party.PartyName,
                PartyType = party.PartyType,
                PrimaryContact = contact?.Contact,
                ActiveOwnedUnitCount = stats?.ActiveCount ?? 0,
                TotalHistoricalUnitsCount = stats?.TotalCount ?? 0,
                LastOwnershipActivityDate = stats?.LastActivity,
                HasCommunityUserAccount = partiesWithAccounts.Contains(party.Id)
            };
        }).ToList();

        var pagedResult = PagedResult<OwnerSummaryDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<OwnerSummaryDto>>.Success(pagedResult);
    }
}
