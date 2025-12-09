using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Authorization;

/// <summary>
/// Implementation of IResourceOwnershipChecker that determines user access levels
/// based on their permissions and resolves unit membership via lease and ownership records.
/// </summary>
public class ResourceOwnershipChecker : IResourceOwnershipChecker
{
    private readonly ICurrentUser _currentUser;
    private readonly ITenantDbContext _dbContext;
    private readonly IMemoryCache _cache;

    // Cache duration for user unit IDs
    private static readonly TimeSpan UnitIdsCacheDuration = TimeSpan.FromMinutes(5);

    public ResourceOwnershipChecker(
        ICurrentUser currentUser,
        ITenantDbContext dbContext,
        IMemoryCache cache)
    {
        _currentUser = currentUser;
        _dbContext = dbContext;
        _cache = cache;
    }

    /// <inheritdoc />
    public AmenityBookingAccess GetAmenityBookingAccess()
    {
        var permissions = GetAllPermissions();

        // Check full-level permissions
        var canViewAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.View);
        var canCreateForAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.Book);
        var canManageAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.Manage)
                        || HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.Book);

        // Check unit-level permissions
        var canViewUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingViewUnit);
        var canCreateForUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingCreateUnit);
        var canManageUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingManageUnit);

        // Check own-level permissions
        var canViewOwn = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingViewOwn);
        var canCreateForSelf = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingCreateOwn);
        var canManageOwn = HasPermissionOrImplied(permissions, Permissions.Tenant.Amenities.BookingManageOwn);

        return new AmenityBookingAccess
        {
            CanViewAll = canViewAll,
            CanViewUnit = canViewUnit || canViewAll,
            CanViewOwn = canViewOwn || canViewUnit || canViewAll,
            CanCreateForAll = canCreateForAll,
            CanCreateForUnit = canCreateForUnit || canCreateForAll,
            CanCreateForSelf = canCreateForSelf || canCreateForUnit || canCreateForAll,
            CanManageAll = canManageAll,
            CanManageUnit = canManageUnit || canManageAll,
            CanManageOwn = canManageOwn || canManageUnit || canManageAll,
            CurrentTenantUserId = _currentUser.TenantUserId
        };
    }

    /// <inheritdoc />
    public VisitorPassAccess GetVisitorPassAccess()
    {
        var permissions = GetAllPermissions();

        // Check full-level permissions
        var canViewAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.View);
        var canCreateForAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.Create);
        var canManageAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.Manage);

        // Check unit-level permissions
        var canViewUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.ViewUnit);
        var canCreateForUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.CreateUnit);
        var canManageUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.ManageUnit);

        // Check own-level permissions
        var canViewOwn = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.ViewOwn);
        var canCreateForSelf = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.CreateOwn);
        var canManageOwn = HasPermissionOrImplied(permissions, Permissions.Tenant.Visitors.ManageOwn);

        return new VisitorPassAccess
        {
            CanViewAll = canViewAll,
            CanViewUnit = canViewUnit || canViewAll,
            CanViewOwn = canViewOwn || canViewUnit || canViewAll,
            CanCreateForAll = canCreateForAll,
            CanCreateForUnit = canCreateForUnit || canCreateForAll,
            CanCreateForSelf = canCreateForSelf || canCreateForUnit || canCreateForAll,
            CanManageAll = canManageAll,
            CanManageUnit = canManageUnit || canManageAll,
            CanManageOwn = canManageOwn || canManageUnit || canManageAll,
            CurrentTenantUserId = _currentUser.TenantUserId
        };
    }

    /// <inheritdoc />
    public MaintenanceRequestAccess GetMaintenanceRequestAccess()
    {
        var permissions = GetAllPermissions();

        // Check full-level permissions
        var canViewAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestView);
        var canCreateForAll = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestCreate);

        // Check unit-level permissions
        var canViewUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestViewUnit);
        var canCreateForUnit = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestCreateUnit);

        // Check own-level permissions
        var canViewOwn = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestViewOwn);
        var canCreateForSelf = HasPermissionOrImplied(permissions, Permissions.Tenant.Maintenance.RequestCreateOwn);

        return new MaintenanceRequestAccess
        {
            CanViewAll = canViewAll,
            CanViewUnit = canViewUnit || canViewAll,
            CanViewOwn = canViewOwn || canViewUnit || canViewAll,
            CanCreateForAll = canCreateForAll,
            CanCreateForUnit = canCreateForUnit || canCreateForAll,
            CanCreateForSelf = canCreateForSelf || canCreateForUnit || canCreateForAll,
            CurrentTenantUserId = _currentUser.TenantUserId
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> GetUserUnitIdsAsync(CancellationToken cancellationToken = default)
    {
        var tenantUserId = _currentUser.TenantUserId;
        if (!tenantUserId.HasValue)
        {
            return Array.Empty<Guid>();
        }

        var cacheKey = $"user:units:{tenantUserId}";

        if (_cache.TryGetValue(cacheKey, out List<Guid>? cachedUnitIds) && cachedUnitIds != null)
        {
            return cachedUnitIds;
        }

        // Get the PartyId for this CommunityUser
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(cu => cu.Id == tenantUserId.Value && cu.IsActive)
            .Select(cu => new { cu.Id, cu.PartyId })
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser == null)
        {
            return Array.Empty<Guid>();
        }

        // Get units where user is a lease party (resident/tenant)
        // Check both CommunityUserId direct link and PartyId indirect link
        var leaseUnitIds = await _dbContext.LeaseParties
            .AsNoTracking()
            .Where(lp => lp.IsActive
                && (lp.CommunityUserId == tenantUserId.Value || lp.PartyId == communityUser.PartyId)
                && !lp.MoveOutDate.HasValue) // Currently residing
            .Join(
                _dbContext.Leases.Where(l => l.IsActive && l.Status == LeaseStatus.Active),
                lp => lp.LeaseId,
                l => l.Id,
                (lp, l) => l.UnitId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Get units where user is an owner
        var ownerUnitIds = await _dbContext.UnitOwnerships
            .AsNoTracking()
            .Where(uo => uo.PartyId == communityUser.PartyId
                && uo.IsActive
                && !uo.ToDate.HasValue) // Currently active ownership
            .Select(uo => uo.UnitId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Combine both sets
        var unitIds = leaseUnitIds.Union(ownerUnitIds).ToList();

        // Cache the result
        _cache.Set(cacheKey, unitIds, UnitIdsCacheDuration);

        return unitIds;
    }

    /// <summary>
    /// Gets all user permissions (platform + tenant).
    /// </summary>
    private HashSet<string> GetAllPermissions()
    {
        return _currentUser.PlatformPermissions
            .Concat(_currentUser.TenantPermissions)
            .ToHashSet();
    }

    /// <summary>
    /// Checks if user has the permission directly or via hierarchy.
    /// </summary>
    private static bool HasPermissionOrImplied(HashSet<string> permissions, string targetPermission)
    {
        return PermissionHierarchy.HasPermissionOrImplied(permissions, targetPermission);
    }
}
