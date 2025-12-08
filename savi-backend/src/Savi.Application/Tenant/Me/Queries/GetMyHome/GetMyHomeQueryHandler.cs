using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Queries.GetMyHome;

/// <summary>
/// Handler for getting the current user's home information.
/// Returns units, leases, and co-residents.
///
/// Flow:
/// 1. Get CommunityUser → PartyId
/// 2. Get LeaseParties by PartyId
/// 3. Get Active leases (not Draft/Ended/Terminated)
/// 4. Get Units for those leases
/// 5. Get co-residents on same leases
/// </summary>
public class GetMyHomeQueryHandler : IRequestHandler<GetMyHomeQuery, Result<MyHomeDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<GetMyHomeQueryHandler> _logger;
    private readonly IFileStorageService _fileStorageService;

    public GetMyHomeQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<GetMyHomeQueryHandler> logger,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<MyHomeDto>> Handle(GetMyHomeQuery request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("GetMyHome called without tenant context");
            return Result<MyHomeDto>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Getting home info for community user {CommunityUserId}", tenantUserId);

        // 1. Get CommunityUser to get PartyId
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.Id == tenantUserId && cu.IsActive)
            .Select(cu => new { cu.Id, cu.PartyId })
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser == null)
        {
            _logger.LogWarning("CommunityUser not found for {CommunityUserId}", tenantUserId);
            return Result<MyHomeDto>.Failure("Community user not found.");
        }

        _logger.LogInformation("Found CommunityUser {CommunityUserId} with PartyId {PartyId}",
            communityUser.Id, communityUser.PartyId);

        // 2. Get all active lease parties for this Party
        var myLeaseParties = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => lp.PartyId == communityUser.PartyId && lp.IsActive)
            .ToListAsync(cancellationToken);

        if (!myLeaseParties.Any())
        {
            _logger.LogInformation("No lease parties found for PartyId {PartyId}", communityUser.PartyId);
            return Result<MyHomeDto>.Success(new MyHomeDto { Units = new List<MyUnitDto>() });
        }

        var leaseIds = myLeaseParties.Select(lp => lp.LeaseId).Distinct().ToList();

        // 3. Get Active leases only (not Draft, Ended, or Terminated)
        var leases = await _dbContext.Leases
            .AsNoTracking()
            .Where(l => leaseIds.Contains(l.Id) && l.IsActive && l.Status == LeaseStatus.Active)
            .ToListAsync(cancellationToken);

        if (!leases.Any())
        {
            _logger.LogInformation("No active leases found for PartyId {PartyId}", communityUser.PartyId);
            return Result<MyHomeDto>.Success(new MyHomeDto { Units = new List<MyUnitDto>() });
        }

        var activeLeaseIds = leases.Select(l => l.Id).ToList();
        var unitIds = leases.Select(l => l.UnitId).Distinct().ToList();

        // 4. Get units with block, floor, and unit type info
        var units = await _dbContext.Units
            .AsNoTracking()
            .Where(u => unitIds.Contains(u.Id) && u.IsActive)
            .ToListAsync(cancellationToken);

        var blockIds = units.Select(u => u.BlockId).Distinct().ToList();
        var floorIds = units.Select(u => u.FloorId).Distinct().ToList();
        var unitTypeIds = units.Select(u => u.UnitTypeId).Distinct().ToList();

        var blocks = await _dbContext.Blocks
            .AsNoTracking()
            .Where(b => blockIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken);

        var floors = await _dbContext.Floors
            .AsNoTracking()
            .Where(f => floorIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, f => f.Name, cancellationToken);

        var unitTypes = await _dbContext.UnitTypes
            .AsNoTracking()
            .Where(ut => unitTypeIds.Contains(ut.Id))
            .ToDictionaryAsync(ut => ut.Id, ut => ut.Name, cancellationToken);

        // 5. Get all lease parties for the active leases (to get co-residents)
        var allLeaseParties = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => activeLeaseIds.Contains(lp.LeaseId) && lp.IsActive)
            .ToListAsync(cancellationToken);

        // Get party information for all lease parties
        var partyIds = allLeaseParties.Select(lp => lp.PartyId).Distinct().ToList();
        var parties = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => partyIds.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        // Get community user IDs for profile photos
        var communityUserIds = allLeaseParties
            .Where(lp => lp.CommunityUserId.HasValue)
            .Select(lp => lp.CommunityUserId!.Value)
            .Distinct()
            .ToList();

        var profiles = await _dbContext.CommunityUserProfiles
            .AsNoTracking()
            .Where(p => communityUserIds.Contains(p.CommunityUserId) && p.IsActive)
            .ToDictionaryAsync(p => p.CommunityUserId, cancellationToken);

        // Resolve profile photo URLs
        var documentIds = profiles.Values
            .Where(p => p.ProfilePhotoDocumentId.HasValue)
            .Select(p => p.ProfilePhotoDocumentId!.Value)
            .Distinct()
            .ToList();

        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Where(d => documentIds.Contains(d.Id) && d.IsActive)
            .ToDictionaryAsync(d => d.Id, cancellationToken);

        var profilePhotoUrls = new Dictionary<Guid, string>();
        foreach (var profile in profiles.Values)
        {
            if (profile.ProfilePhotoDocumentId.HasValue &&
                documents.TryGetValue(profile.ProfilePhotoDocumentId.Value, out var document))
            {
                try
                {
                    var url = await _fileStorageService.GetDownloadUrlAsync(document.BlobPath, expiresInMinutes: 60, cancellationToken);
                    profilePhotoUrls[profile.CommunityUserId] = url;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to resolve profile photo URL for document {DocumentId}", document.Id);
                }
            }
        }

        // Build the response
        var unitDtos = new List<MyUnitDto>();

        foreach (var unit in units)
        {
            var lease = leases.FirstOrDefault(l => l.UnitId == unit.Id);
            if (lease == null) continue;

            var myLeaseParty = myLeaseParties.FirstOrDefault(lp => lp.LeaseId == lease.Id);
            if (myLeaseParty == null) continue;

            var leasePartiesForLease = allLeaseParties.Where(lp => lp.LeaseId == lease.Id).ToList();

            var residents = new List<MyResidentDto>();
            foreach (var lp in leasePartiesForLease)
            {
                parties.TryGetValue(lp.PartyId, out var party);

                string? profilePhotoUrl = null;
                if (lp.CommunityUserId.HasValue)
                {
                    profilePhotoUrls.TryGetValue(lp.CommunityUserId.Value, out profilePhotoUrl);
                }

                residents.Add(new MyResidentDto
                {
                    PartyId = lp.PartyId,
                    LeasePartyId = lp.Id,
                    Name = party?.PartyName ?? $"{party?.FirstName} {party?.LastName}".Trim(),
                    Role = lp.Role,
                    IsPrimary = lp.IsPrimary,
                    HasAppAccess = lp.CommunityUserId.HasValue,
                    ProfilePhotoUrl = profilePhotoUrl
                });
            }

            blocks.TryGetValue(unit.BlockId, out var blockName);
            floors.TryGetValue(unit.FloorId, out var floorName);
            unitTypes.TryGetValue(unit.UnitTypeId, out var unitTypeName);

            unitDtos.Add(new MyUnitDto
            {
                UnitId = unit.Id,
                UnitNumber = unit.UnitNumber,
                BlockName = blockName,
                FloorName = floorName,
                UnitTypeName = unitTypeName,
                AreaSqft = unit.AreaSqft,
                Lease = new MyLeaseDto
                {
                    LeaseId = lease.Id,
                    Status = lease.Status,
                    StartDate = lease.StartDate,
                    EndDate = lease.EndDate,
                    Role = myLeaseParty.Role,
                    IsPrimary = myLeaseParty.IsPrimary,
                    MoveInDate = myLeaseParty.MoveInDate,
                    MoveOutDate = myLeaseParty.MoveOutDate
                },
                Residents = residents
            });
        }

        var result = new MyHomeDto
        {
            Units = unitDtos
        };

        _logger.LogInformation("Returning {UnitCount} units for community user {CommunityUserId} (PartyId: {PartyId})",
            unitDtos.Count, tenantUserId, communityUser.PartyId);

        return Result<MyHomeDto>.Success(result);
    }
}
