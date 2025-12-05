using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Residents.Dtos;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Residents.Queries.GetResidentProfile;

/// <summary>
/// Handler for GetResidentProfileQuery.
/// Returns a comprehensive resident profile with all residencies, invites, and account info.
/// </summary>
public class GetResidentProfileQueryHandler
    : IRequestHandler<GetResidentProfileQuery, Result<ResidentProfileDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetResidentProfileQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<ResidentProfileDto>> Handle(
        GetResidentProfileQuery request,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Get party
        var party = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.Id == request.PartyId && p.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (party == null)
        {
            return Result<ResidentProfileDto>.Failure($"Party with ID '{request.PartyId}' not found.");
        }

        // Get primary contacts by type
        var primaryContacts = await _dbContext.PartyContacts
            .AsNoTracking()
            .Where(pc => pc.PartyId == request.PartyId && pc.IsActive && pc.IsPrimary)
            .ToListAsync(cancellationToken);

        var primaryEmail = primaryContacts
            .FirstOrDefault(c => c.ContactType == PartyContactType.Email)?.Value;
        var primaryPhone = primaryContacts
            .FirstOrDefault(c => c.ContactType == PartyContactType.Mobile || c.ContactType == PartyContactType.Phone)?.Value;

        // Get all lease parties for this party (with resident roles)
        var leaseParties = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => lp.PartyId == request.PartyId &&
                        lp.IsActive &&
                        (lp.Role == LeasePartyRole.PrimaryResident || lp.Role == LeasePartyRole.CoResident))
            .ToListAsync(cancellationToken);

        // Get all related leases
        var leaseIds = leaseParties.Select(lp => lp.LeaseId).Distinct().ToList();
        var leases = await _dbContext.Leases
            .AsNoTracking()
            .Where(l => leaseIds.Contains(l.Id) && l.IsActive)
            .ToListAsync(cancellationToken);

        // Get unit info for all leases
        var unitIds = leases.Select(l => l.UnitId).Distinct().ToList();
        var unitInfoDict = await (from unit in _dbContext.Units.AsNoTracking()
                                  where unitIds.Contains(unit.Id)
                                  select new
                                  {
                                      unit.Id,
                                      unit.UnitNumber,
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

        // Get co-residents for each lease
        var allLeaseParties = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => leaseIds.Contains(lp.LeaseId) && lp.IsActive)
            .Join(
                _dbContext.Parties,
                lp => lp.PartyId,
                p => p.Id,
                (lp, p) => new { LeaseParty = lp, Party = p })
            .ToListAsync(cancellationToken);

        // Get community user info (if any linked to this party's lease parties)
        var communityUserIds = leaseParties
            .Where(lp => lp.CommunityUserId.HasValue)
            .Select(lp => lp.CommunityUserId!.Value)
            .Distinct()
            .ToList();

        var communityUser = communityUserIds.Any()
            ? await _dbContext.CommunityUsers
                .AsNoTracking()
                .Where(cu => communityUserIds.Contains(cu.Id) && cu.IsActive)
                .FirstOrDefaultAsync(cancellationToken)
            : null;

        // Get resident invites
        var invites = await _dbContext.ResidentInvites
            .AsNoTracking()
            .Where(ri => ri.PartyId == request.PartyId && ri.IsActive)
            .OrderByDescending(ri => ri.CreatedAt)
            .ToListAsync(cancellationToken);

        // Build residencies list
        var residencies = leaseParties.Select(lp =>
        {
            var lease = leases.FirstOrDefault(l => l.Id == lp.LeaseId);
            if (lease == null) return null;

            var unitInfo = unitInfoDict.GetValueOrDefault(lease.UnitId);
            var isCurrent = lease.Status == LeaseStatus.Active &&
                           lp.MoveInDate.HasValue &&
                           lp.MoveInDate.Value <= today &&
                           !lp.MoveOutDate.HasValue;

            var coResidents = allLeaseParties
                .Where(x => x.LeaseParty.LeaseId == lp.LeaseId && x.LeaseParty.Id != lp.Id)
                .Select(x => new CoResidentDto
                {
                    LeasePartyId = x.LeaseParty.Id,
                    PartyId = x.Party.Id,
                    Name = x.Party.PartyName,
                    Role = x.LeaseParty.Role,
                    IsPrimary = x.LeaseParty.IsPrimary,
                    HasAppAccess = x.LeaseParty.CommunityUserId.HasValue
                })
                .ToList();

            return new ResidentLeaseDto
            {
                LeasePartyId = lp.Id,
                LeaseId = lease.Id,
                Unit = new ResidentUnitDto
                {
                    UnitId = lease.UnitId,
                    UnitNumber = unitInfo?.UnitNumber ?? string.Empty,
                    BlockName = unitInfo?.BlockName,
                    FloorName = unitInfo?.FloorName
                },
                LeaseStatus = lease.Status,
                Role = lp.Role,
                IsPrimary = lp.IsPrimary,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                MoveInDate = lp.MoveInDate,
                MoveOutDate = lp.MoveOutDate,
                IsCurrent = isCurrent,
                CoResidents = coResidents
            };
        })
        .Where(r => r != null)
        .Cast<ResidentLeaseDto>()
        .OrderByDescending(r => r.IsCurrent)
        .ThenByDescending(r => r.StartDate)
        .ToList();

        // Determine current residency
        var currentResidency = residencies.FirstOrDefault(r => r.IsCurrent);
        var status = currentResidency != null
            ? ResidencyStatus.Current
            : residencies.Any(r => r.LeaseStatus == LeaseStatus.Draft ||
                                   (r.LeaseStatus == LeaseStatus.Active && !r.MoveInDate.HasValue))
                ? ResidencyStatus.Upcoming
                : ResidencyStatus.Past;

        // Build invite DTOs
        var inviteDtos = invites.Select(inv => new ResidentInviteDto
        {
            Id = inv.Id,
            LeaseId = inv.LeaseId,
            PartyId = inv.PartyId,
            Role = inv.Role,
            Email = inv.Email,
            Status = inv.Status,
            ExpiresAt = inv.ExpiresAt,
            AcceptedAt = inv.AcceptedAt,
            CancelledAt = inv.CancelledAt,
            CreatedAt = inv.CreatedAt
        }).ToList();

        var profile = new ResidentProfileDto
        {
            PartyId = party.Id,
            ResidentName = party.PartyName,
            PartyType = party.PartyType,
            Email = primaryEmail,
            Phone = primaryPhone,
            CurrentUnit = currentResidency?.Unit,
            Status = status,
            HasAppAccess = communityUser != null,
            CommunityUserId = communityUser?.Id,
            LoginEmail = primaryEmail, // Use party's email as login email
            LastLoginAt = null, // Would need to track this in CommunityUser
            Residencies = residencies,
            Invites = inviteDtos,
            CreatedAt = party.CreatedAt
        };

        return Result<ResidentProfileDto>.Success(profile);
    }
}
