using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Units.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Units.Queries.GetPartiesByUnit;

/// <summary>
/// Handler to get parties (residents and/or owners) associated with a unit.
/// Supports filtering by association type and primary status.
/// </summary>
public class GetPartiesByUnitQueryHandler
    : IRequestHandler<GetPartiesByUnitQuery, Result<List<UnitPartyDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public GetPartiesByUnitQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<UnitPartyDto>>> Handle(
        GetPartiesByUnitQuery request,
        CancellationToken cancellationToken)
    {
        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<List<UnitPartyDto>>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        var parties = new List<UnitPartyDto>();

        // Get residents if filter allows
        if (request.AssociationFilter == PartyAssociationFilter.All ||
            request.AssociationFilter == PartyAssociationFilter.Residents)
        {
            var residents = await GetCurrentResidents(request.UnitId, request.PrimaryOnly, cancellationToken);
            parties.AddRange(residents);
        }

        // Get owners if filter allows
        if (request.AssociationFilter == PartyAssociationFilter.All ||
            request.AssociationFilter == PartyAssociationFilter.Owners)
        {
            var owners = await GetCurrentOwners(request.UnitId, request.PrimaryOnly, cancellationToken);
            parties.AddRange(owners);
        }

        return Result<List<UnitPartyDto>>.Success(parties);
    }

    private async Task<List<UnitPartyDto>> GetCurrentResidents(
        Guid unitId,
        bool? primaryOnly,
        CancellationToken cancellationToken)
    {
        // Get parties from active leases for this unit
        // Only include PrimaryResident and CoResident roles (not Guarantor)
        var query = from lp in _dbContext.LeaseParties.Where(lp => lp.IsActive)
                    join l in _dbContext.Leases.Where(l => l.IsActive && l.Status == LeaseStatus.Active)
                        on lp.LeaseId equals l.Id
                    join p in _dbContext.Parties.Where(p => p.IsActive)
                        on lp.PartyId equals p.Id
                    where l.UnitId == unitId
                        && (lp.Role == LeasePartyRole.PrimaryResident || lp.Role == LeasePartyRole.CoResident)
                        && !lp.MoveOutDate.HasValue // Not moved out
                    select new
                    {
                        lp.PartyId,
                        p.PartyName,
                        p.PartyType,
                        lp.Role,
                        lp.IsPrimary
                    };

        // Apply primary filter if specified
        if (primaryOnly == true)
        {
            query = query.Where(r => r.IsPrimary);
        }

        var residentData = await query.ToListAsync(cancellationToken);

        // Get contacts for these parties
        var partyIds = residentData.Select(r => r.PartyId).ToList();
        var contacts = await GetPrimaryContacts(partyIds, cancellationToken);

        return residentData.Select(r => new UnitPartyDto
        {
            PartyId = r.PartyId,
            PartyName = r.PartyName,
            PartyType = r.PartyType,
            AssociationType = "Resident",
            Role = r.Role.ToString(),
            IsPrimary = r.IsPrimary,
            Email = contacts.TryGetValue(r.PartyId, out var contact) ? contact.Email : null,
            Phone = contacts.TryGetValue(r.PartyId, out contact) ? contact.Phone : null
        }).ToList();
    }

    private async Task<List<UnitPartyDto>> GetCurrentOwners(
        Guid unitId,
        bool? primaryOnly,
        CancellationToken cancellationToken)
    {
        // Get current owners (no ToDate set, meaning ownership is still active)
        var query = from uo in _dbContext.UnitOwnerships.Where(uo => uo.IsActive && uo.ToDate == null)
                    join p in _dbContext.Parties.Where(p => p.IsActive)
                        on uo.PartyId equals p.Id
                    where uo.UnitId == unitId
                    select new
                    {
                        uo.PartyId,
                        p.PartyName,
                        p.PartyType,
                        uo.IsPrimaryOwner
                    };

        // Apply primary filter if specified
        if (primaryOnly == true)
        {
            query = query.Where(o => o.IsPrimaryOwner);
        }

        var ownerData = await query.ToListAsync(cancellationToken);

        // Get contacts for these parties
        var partyIds = ownerData.Select(o => o.PartyId).ToList();
        var contacts = await GetPrimaryContacts(partyIds, cancellationToken);

        return ownerData.Select(o => new UnitPartyDto
        {
            PartyId = o.PartyId,
            PartyName = o.PartyName,
            PartyType = o.PartyType,
            AssociationType = "Owner",
            Role = o.IsPrimaryOwner ? "PrimaryOwner" : "CoOwner",
            IsPrimary = o.IsPrimaryOwner,
            Email = contacts.TryGetValue(o.PartyId, out var contact) ? contact.Email : null,
            Phone = contacts.TryGetValue(o.PartyId, out contact) ? contact.Phone : null
        }).ToList();
    }

    private async Task<Dictionary<Guid, (string? Email, string? Phone)>> GetPrimaryContacts(
        List<Guid> partyIds,
        CancellationToken cancellationToken)
    {
        if (!partyIds.Any())
        {
            return new Dictionary<Guid, (string? Email, string? Phone)>();
        }

        var contacts = await _dbContext.PartyContacts
            .Where(pc => partyIds.Contains(pc.PartyId) && pc.IsActive && pc.IsPrimary)
            .Select(pc => new { pc.PartyId, pc.ContactType, pc.Value })
            .ToListAsync(cancellationToken);

        return partyIds.ToDictionary(
            id => id,
            id =>
            {
                var partyContacts = contacts.Where(c => c.PartyId == id).ToList();
                var email = partyContacts.FirstOrDefault(c => c.ContactType == PartyContactType.Email)?.Value;
                var phone = partyContacts.FirstOrDefault(c => c.ContactType == PartyContactType.Mobile)?.Value
                         ?? partyContacts.FirstOrDefault(c => c.ContactType == PartyContactType.Phone)?.Value;
                return (email, phone);
            });
    }
}
