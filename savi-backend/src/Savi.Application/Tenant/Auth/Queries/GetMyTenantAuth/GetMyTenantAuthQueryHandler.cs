using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.MultiTenancy;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Auth.Queries.GetMyTenantAuth;

/// <summary>
/// Handler for GetMyTenantAuthQuery.
/// Returns the current user's auth context for a specific tenant.
/// </summary>
public sealed class GetMyTenantAuthQueryHandler
    : IRequestHandler<GetMyTenantAuthQuery, Result<TenantAuthMeResponseDto>>
{
    private readonly ICurrentUser _currentUser;
    private readonly ITenantContext _tenantContext;
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ITenantDbContext _tenantDbContext;
    private readonly ILogger<GetMyTenantAuthQueryHandler> _logger;

    public GetMyTenantAuthQueryHandler(
        ICurrentUser currentUser,
        ITenantContext tenantContext,
        IPlatformDbContext platformDbContext,
        ITenantDbContext tenantDbContext,
        ILogger<GetMyTenantAuthQueryHandler> logger)
    {
        _currentUser = currentUser;
        _tenantContext = tenantContext;
        _platformDbContext = platformDbContext;
        _tenantDbContext = tenantDbContext;
        _logger = logger;
    }

    public async Task<Result<TenantAuthMeResponseDto>> Handle(
        GetMyTenantAuthQuery request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Getting tenant/auth/me for user {UserId}, tenant: {TenantCode}",
            _currentUser.UserId,
            _tenantContext.TenantCode);

        // Verify tenant context exists
        if (!_tenantContext.TenantId.HasValue)
        {
            return Result.Failure<TenantAuthMeResponseDto>(
                "Tenant context is required. Please provide X-Tenant-Code header.");
        }

        // Get platform user info
        var platformUser = await _platformDbContext.PlatformUsers
            .AsNoTracking()
            .Where(u => u.Id == _currentUser.UserId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.PhoneNumber
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (platformUser == null)
        {
            _logger.LogWarning("PlatformUser not found for UserId {UserId}", _currentUser.UserId);
            return Result.Failure<TenantAuthMeResponseDto>("User not found.");
        }

        // Get community user with profile (for display name)
        Guid? communityUserId = null;
        Guid? partyId = null;
        string? displayName = null;

        var communityUser = await _tenantDbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.PlatformUserId == _currentUser.UserId && cu.IsActive)
            .Select(cu => new { cu.Id, cu.PartyId })
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser != null)
        {
            communityUserId = communityUser.Id;
            partyId = communityUser.PartyId;

            // Get display name from CommunityUserProfile
            var profile = await _tenantDbContext.CommunityUserProfiles
                .AsNoTracking()
                .Where(p => p.CommunityUserId == communityUser.Id && p.IsActive)
                .Select(p => new { p.DisplayName })
                .FirstOrDefaultAsync(cancellationToken);

            displayName = profile?.DisplayName;
        }

        // Get user's leases via PartyId path: CommunityUser.PartyId -> LeaseParty.PartyId -> Lease -> Unit
        var leases = new List<UserLeaseDto>();
        if (partyId.HasValue)
        {
            leases = await _tenantDbContext.LeaseParties
                .AsNoTracking()
                .Where(lp => lp.PartyId == partyId && lp.IsActive)
                .Join(
                    _tenantDbContext.Leases.AsNoTracking().Where(l => l.IsActive),
                    lp => lp.LeaseId,
                    l => l.Id,
                    (lp, l) => new { lp, l })
                .Join(
                    _tenantDbContext.Units.AsNoTracking(),
                    x => x.l.UnitId,
                    u => u.Id,
                    (x, u) => new { x.lp, x.l, u })
                .GroupJoin(
                    _tenantDbContext.Blocks.AsNoTracking(),
                    x => x.u.BlockId,
                    b => b.Id,
                    (x, blocks) => new { x.lp, x.l, x.u, Block = blocks.FirstOrDefault() })
                .Select(x => new UserLeaseDto
                {
                    LeaseId = x.l.Id,
                    UnitId = x.u.Id,
                    UnitLabel = (x.Block != null ? x.Block.Name + "-" : "") + x.u.UnitNumber,
                    Role = x.lp.Role.ToString(),
                    IsPrimary = x.lp.IsPrimary,
                    Status = x.l.Status.ToString()
                })
                .ToListAsync(cancellationToken);
        }

        // Build tenant context
        var tenantContext = new TenantContextDto
        {
            TenantId = _tenantContext.TenantId.Value,
            TenantName = _tenantContext.TenantName ?? "Community"
        };

        // Build permissions dictionary (tenant permissions only)
        var permissions = BuildPermissionsDictionary();

        var response = new TenantAuthMeResponseDto
        {
            UserId = platformUser.Id,
            TenantUserId = _currentUser.TenantUserId,
            CommunityUserId = communityUserId,
            DisplayName = displayName,
            Email = platformUser.Email,
            PhoneNumber = platformUser.PhoneNumber,
            Tenant = tenantContext,
            Roles = _currentUser.TenantRoles.ToList(),
            Leases = leases,
            Permissions = permissions
        };

        _logger.LogInformation(
            "Tenant auth/me response for user {UserId}: {RoleCount} roles, {LeaseCount} leases, {PermissionCount} permissions",
            platformUser.Id,
            response.Roles.Count,
            leases.Count,
            permissions.Count);

        return Result.Success(response);
    }

    /// <summary>
    /// Builds the permissions dictionary for tenant context.
    /// </summary>
    private Dictionary<string, bool> BuildPermissionsDictionary()
    {
        var permissions = new Dictionary<string, bool>();

        // Get all defined tenant permission keys
        var allTenantPermissions = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .Select(p => p.Key)
            .ToHashSet();

        // Mark each permission as true/false based on user's grants
        foreach (var permKey in allTenantPermissions)
        {
            permissions[permKey] = _currentUser.TenantPermissions.Contains(permKey);
        }

        return permissions;
    }
}
