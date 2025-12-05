using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Queries.ListResidentInvitesByLease;

/// <summary>
/// Handler for ListResidentInvitesByLeaseQuery.
/// </summary>
public class ListResidentInvitesByLeaseQueryHandler
    : IRequestHandler<ListResidentInvitesByLeaseQuery, Result<PagedResult<ResidentInviteDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListResidentInvitesByLeaseQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<ResidentInviteDto>>> Handle(
        ListResidentInvitesByLeaseQuery request,
        CancellationToken cancellationToken)
    {
        // Verify lease exists
        var leaseExists = await _dbContext.Leases
            .AsNoTracking()
            .AnyAsync(l => l.Id == request.LeaseId && l.IsActive, cancellationToken);

        if (!leaseExists)
        {
            return Result<PagedResult<ResidentInviteDto>>.Failure(
                $"Lease with ID '{request.LeaseId}' not found.");
        }

        var query = _dbContext.ResidentInvites
            .AsNoTracking()
            .Where(ri => ri.LeaseId == request.LeaseId && ri.IsActive);

        // Apply status filter
        if (request.Status.HasValue)
        {
            query = query.Where(ri => ri.Status == request.Status.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get party names lookup
        var invites = await query
            .OrderByDescending(ri => ri.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var partyIds = invites.Select(i => i.PartyId).Distinct().ToList();
        var partyNames = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => partyIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.PartyName, cancellationToken);

        var items = invites.Select(ri => new ResidentInviteDto
        {
            Id = ri.Id,
            LeaseId = ri.LeaseId,
            PartyId = ri.PartyId,
            PartyName = partyNames.GetValueOrDefault(ri.PartyId, "Unknown"),
            Role = ri.Role,
            Status = ri.Status,
            Email = ri.Email,
            ExpiresAt = ri.ExpiresAt,
            AcceptedAt = ri.AcceptedAt,
            CancelledAt = ri.CancelledAt,
            CreatedAt = ri.CreatedAt
        }).ToList();

        var result = new PagedResult<ResidentInviteDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<ResidentInviteDto>>.Success(result);
    }
}
