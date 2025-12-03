using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByParty;

/// <summary>
/// Handler for listing unit ownerships by party.
/// </summary>
public class ListUnitOwnershipsByPartyQueryHandler
    : IRequestHandler<ListUnitOwnershipsByPartyQuery, Result<PagedResult<UnitOwnershipDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListUnitOwnershipsByPartyQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<UnitOwnershipDto>>> Handle(
        ListUnitOwnershipsByPartyQuery request,
        CancellationToken cancellationToken)
    {
        // Verify party exists
        var partyExists = await _dbContext.Parties
            .AsNoTracking()
            .AnyAsync(p => p.Id == request.PartyId && p.IsActive, cancellationToken);

        if (!partyExists)
        {
            return Result<PagedResult<UnitOwnershipDto>>.Failure(
                $"Party with ID '{request.PartyId}' not found.");
        }

        // Build query
        var query = _dbContext.UnitOwnerships
            .AsNoTracking()
            .Where(o => o.PartyId == request.PartyId && o.IsActive);

        // Filter for current only if requested
        if (request.CurrentOnly)
        {
            query = query.Where(o => o.ToDate == null);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Join with related data
        var items = await query
            .Join(
                _dbContext.Parties.AsNoTracking(),
                o => o.PartyId,
                p => p.Id,
                (o, p) => new { Ownership = o, Party = p })
            .Join(
                _dbContext.Units.AsNoTracking(),
                x => x.Ownership.UnitId,
                u => u.Id,
                (x, u) => new { x.Ownership, x.Party, Unit = u })
            .Join(
                _dbContext.Blocks.AsNoTracking(),
                x => x.Unit.BlockId,
                b => b.Id,
                (x, b) => new { x.Ownership, x.Party, x.Unit, Block = b })
            .Join(
                _dbContext.Floors.AsNoTracking(),
                x => x.Unit.FloorId,
                f => f.Id,
                (x, f) => new { x.Ownership, x.Party, x.Unit, x.Block, Floor = f })
            .OrderByDescending(x => x.Ownership.FromDate)
            .ThenBy(x => x.Unit.UnitNumber)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new UnitOwnershipDto
            {
                Id = x.Ownership.Id,
                UnitId = x.Ownership.UnitId,
                UnitNumber = x.Unit.UnitNumber,
                BlockName = x.Block.Name,
                FloorName = x.Floor.Name,
                PartyId = x.Ownership.PartyId,
                PartyName = x.Party.PartyName,
                PartyType = x.Party.PartyType,
                OwnershipShare = x.Ownership.OwnershipShare,
                FromDate = x.Ownership.FromDate,
                ToDate = x.Ownership.ToDate,
                IsPrimaryOwner = x.Ownership.IsPrimaryOwner,
                IsActive = x.Ownership.IsActive,
                CreatedAt = x.Ownership.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var pagedResult = PagedResult<UnitOwnershipDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<UnitOwnershipDto>>.Success(pagedResult);
    }
}
