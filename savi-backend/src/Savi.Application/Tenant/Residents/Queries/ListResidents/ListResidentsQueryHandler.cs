using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Residents.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Residents.Queries.ListResidents;

/// <summary>
/// Handler for ListResidentsQuery.
/// Lists residents (LeaseParty records with resident roles) with filtering capabilities.
/// </summary>
public class ListResidentsQueryHandler
    : IRequestHandler<ListResidentsQuery, Result<PagedResult<ResidentDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListResidentsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<ResidentDto>>> Handle(
        ListResidentsQuery request,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Base query: LeaseParties with resident roles
        var query = from lp in _dbContext.LeaseParties.AsNoTracking()
                    join lease in _dbContext.Leases.AsNoTracking()
                        on lp.LeaseId equals lease.Id
                    join party in _dbContext.Parties.AsNoTracking()
                        on lp.PartyId equals party.Id
                    join unit in _dbContext.Units.AsNoTracking()
                        on lease.UnitId equals unit.Id
                    where lp.IsActive
                          && lease.IsActive
                          && party.IsActive
                          && (lp.Role == LeasePartyRole.PrimaryResident || lp.Role == LeasePartyRole.CoResident)
                    select new
                    {
                        LeaseParty = lp,
                        Lease = lease,
                        Party = party,
                        Unit = unit
                    };

        // Apply unit filter
        if (request.UnitId.HasValue)
        {
            query = query.Where(x => x.Unit.Id == request.UnitId.Value);
        }

        // Apply block filter
        if (request.BlockId.HasValue)
        {
            query = query.Where(x => x.Unit.BlockId == request.BlockId.Value);
        }

        // Apply floor filter
        if (request.FloorId.HasValue)
        {
            query = query.Where(x => x.Unit.FloorId == request.FloorId.Value);
        }

        // Apply app access filter
        if (request.HasAppAccess.HasValue)
        {
            if (request.HasAppAccess.Value)
            {
                query = query.Where(x => x.LeaseParty.CommunityUserId != null);
            }
            else
            {
                query = query.Where(x => x.LeaseParty.CommunityUserId == null);
            }
        }

        // Apply search term
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            query = query.Where(x =>
                x.Party.PartyName.ToLower().Contains(searchLower));
        }

        // Apply status filter
        if (request.Status.HasValue)
        {
            query = request.Status.Value switch
            {
                ResidencyStatus.Current => query.Where(x =>
                    x.Lease.Status == LeaseStatus.Active &&
                    x.LeaseParty.MoveInDate.HasValue &&
                    x.LeaseParty.MoveInDate.Value <= today &&
                    !x.LeaseParty.MoveOutDate.HasValue),

                ResidencyStatus.Upcoming => query.Where(x =>
                    (x.Lease.Status == LeaseStatus.Draft ||
                     (x.Lease.Status == LeaseStatus.Active &&
                      (!x.LeaseParty.MoveInDate.HasValue || x.LeaseParty.MoveInDate.Value > today)))),

                ResidencyStatus.Past => query.Where(x =>
                    x.Lease.Status == LeaseStatus.Ended ||
                    x.Lease.Status == LeaseStatus.Terminated ||
                    (x.LeaseParty.MoveOutDate.HasValue && x.LeaseParty.MoveOutDate.Value <= today)),

                _ => query
            };
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get block and floor names for all matching units
        var unitIds = await query
            .Select(x => x.Unit.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        var unitInfoDict = await (from unit in _dbContext.Units.AsNoTracking()
                                  where unitIds.Contains(unit.Id)
                                  select new
                                  {
                                      unit.Id,
                                      unit.UnitNumber,
                                      unit.BlockId,
                                      unit.FloorId,
                                      BlockName = _dbContext.Blocks
                                          .Where(b => b.Id == unit.BlockId)
                                          .Select(b => b.Name)
                                          .FirstOrDefault(),
                                      FloorName = _dbContext.Floors
                                          .Where(f => f.Id == unit.FloorId)
                                          .Select(f => f.Name)
                                          .FirstOrDefault()
                                  })
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        // Get primary contacts for parties
        var partyIds = await query
            .Select(x => x.Party.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        var contacts = await _dbContext.PartyContacts
            .AsNoTracking()
            .Where(pc => partyIds.Contains(pc.PartyId) && pc.IsActive && pc.IsPrimary)
            .ToListAsync(cancellationToken);

        var emailContactsDict = contacts
            .Where(c => c.ContactType == PartyContactType.Email)
            .GroupBy(c => c.PartyId)
            .ToDictionary(g => g.Key, g => g.First().Value);

        var phoneContactsDict = contacts
            .Where(c => c.ContactType == PartyContactType.Mobile || c.ContactType == PartyContactType.Phone)
            .GroupBy(c => c.PartyId)
            .ToDictionary(g => g.Key, g => g.First().Value);

        // Get paginated results
        var results = await query
            .OrderBy(x => x.Party.PartyName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = results.Select(x =>
        {
            var unitInfo = unitInfoDict.GetValueOrDefault(x.Unit.Id);
            var email = emailContactsDict.GetValueOrDefault(x.Party.Id);
            var phone = phoneContactsDict.GetValueOrDefault(x.Party.Id);

            var status = DetermineResidencyStatus(x.Lease.Status, x.LeaseParty.MoveInDate, x.LeaseParty.MoveOutDate, today);

            return new ResidentDto
            {
                LeasePartyId = x.LeaseParty.Id,
                PartyId = x.Party.Id,
                ResidentName = x.Party.PartyName,
                PartyType = x.Party.PartyType,
                Email = email,
                Phone = phone,
                LeaseId = x.Lease.Id,
                UnitId = x.Unit.Id,
                UnitNumber = unitInfo?.UnitNumber ?? x.Unit.UnitNumber,
                BlockName = unitInfo?.BlockName,
                BlockId = unitInfo?.BlockId,
                FloorName = unitInfo?.FloorName,
                FloorId = unitInfo?.FloorId,
                Status = status,
                Role = x.LeaseParty.Role,
                IsPrimary = x.LeaseParty.IsPrimary,
                HasAppAccess = x.LeaseParty.CommunityUserId.HasValue,
                CommunityUserId = x.LeaseParty.CommunityUserId,
                MoveInDate = x.LeaseParty.MoveInDate,
                MoveOutDate = x.LeaseParty.MoveOutDate,
                LeaseStatus = x.Lease.Status,
                StartDate = x.Lease.StartDate,
                EndDate = x.Lease.EndDate
            };
        }).ToList();

        var result = new PagedResult<ResidentDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<ResidentDto>>.Success(result);
    }

    private static ResidencyStatus DetermineResidencyStatus(
        LeaseStatus leaseStatus,
        DateOnly? moveInDate,
        DateOnly? moveOutDate,
        DateOnly today)
    {
        // Past: lease ended/terminated or moved out
        if (leaseStatus == LeaseStatus.Ended || leaseStatus == LeaseStatus.Terminated)
            return ResidencyStatus.Past;

        if (moveOutDate.HasValue && moveOutDate.Value <= today)
            return ResidencyStatus.Past;

        // Upcoming: draft lease or move-in date in future
        if (leaseStatus == LeaseStatus.Draft)
            return ResidencyStatus.Upcoming;

        if (!moveInDate.HasValue || moveInDate.Value > today)
            return ResidencyStatus.Upcoming;

        // Current: active lease, moved in, not moved out
        return ResidencyStatus.Current;
    }
}
