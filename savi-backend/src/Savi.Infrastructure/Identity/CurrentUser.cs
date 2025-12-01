using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Savi.Infrastructure.Persistence.Platform;
using Savi.Infrastructure.Persistence.TenantDb;
using Savi.MultiTenancy;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Identity;

/// <summary>
/// Implementation of ICurrentUser that reads from HttpContext.User and ITenantContext.
/// 
/// Loads permissions from:
/// - Platform: PlatformUserRole → PlatformRolePermission → Permission.Key
/// - Tenant: CommunityUserRoleGroup → RoleGroupPermission.PermissionKey
/// 
/// Permissions are cached for a short duration to avoid repeated DB hits.
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenantContext _tenantContext;
    private readonly PlatformDbContext _platformDbContext;
    private readonly ITenantDbContextFactory _tenantDbContextFactory;
    private readonly IPlatformUserBootstrapService _bootstrapService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CurrentUser> _logger;

    // Cache duration for permissions
    private static readonly TimeSpan PermissionCacheDuration = TimeSpan.FromMinutes(5);

    // Lazy-loaded properties
    private Guid? _userId;
    private string? _email;
    private bool _isLoaded;
    private IReadOnlyCollection<string>? _platformRoles;
    private IReadOnlyCollection<string>? _tenantRoles;
    private IReadOnlyCollection<string>? _platformPermissions;
    private IReadOnlyCollection<string>? _tenantPermissions;

    public CurrentUser(
        IHttpContextAccessor httpContextAccessor,
        ITenantContext tenantContext,
        PlatformDbContext platformDbContext,
        ITenantDbContextFactory tenantDbContextFactory,
        IPlatformUserBootstrapService bootstrapService,
        IMemoryCache cache,
        ILogger<CurrentUser> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantContext = tenantContext;
        _platformDbContext = platformDbContext;
        _tenantDbContextFactory = tenantDbContextFactory;
        _bootstrapService = bootstrapService;
        _cache = cache;
        _logger = logger;
    }

    /// <inheritdoc />
    public Guid UserId
    {
        get
        {
            EnsureLoaded();
            return _userId ?? throw new InvalidOperationException("User is not authenticated.");
        }
    }

    /// <inheritdoc />
    public string Email
    {
        get
        {
            EnsureLoaded();
            return _email ?? throw new InvalidOperationException("User is not authenticated.");
        }
    }

    /// <inheritdoc />
    public Guid? CurrentTenantId => _tenantContext.TenantId;

    /// <inheritdoc />
    public IReadOnlyCollection<string> PlatformRoles
    {
        get
        {
            EnsureLoaded();
            return _platformRoles ?? Array.Empty<string>();
        }
    }

    /// <inheritdoc />
    public IReadOnlyCollection<string> TenantRoles
    {
        get
        {
            EnsureLoaded();
            return _tenantRoles ?? Array.Empty<string>();
        }
    }

    /// <inheritdoc />
    public IReadOnlyCollection<string> PlatformPermissions
    {
        get
        {
            EnsureLoaded();
            return _platformPermissions ?? Array.Empty<string>();
        }
    }

    /// <inheritdoc />
    public IReadOnlyCollection<string> TenantPermissions
    {
        get
        {
            EnsureLoaded();
            return _tenantPermissions ?? Array.Empty<string>();
        }
    }

    /// <inheritdoc />
    public bool HasPlatformRole(string roleCode) => PlatformRoles.Contains(roleCode);

    /// <inheritdoc />
    public bool HasTenantRole(string roleCode) => TenantRoles.Contains(roleCode);

    /// <inheritdoc />
    public bool HasPlatformPermission(string permissionKey) => PlatformPermissions.Contains(permissionKey);

    /// <inheritdoc />
    public bool HasTenantPermission(string permissionKey) => TenantPermissions.Contains(permissionKey);

    /// <inheritdoc />
    public bool HasPermission(string permissionKey) =>
        HasPlatformPermission(permissionKey) || HasTenantPermission(permissionKey);

    /// <summary>
    /// Ensures user data is loaded from the database.
    /// </summary>
    private void EnsureLoaded()
    {
        if (_isLoaded) return;

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User.Identity?.IsAuthenticated != true)
        {
            _isLoaded = true;
            return;
        }

        // Load user synchronously (we're in a property getter)
        // Note: In a real async context, this should be awaited
        LoadUserAsync().GetAwaiter().GetResult();
        _isLoaded = true;
    }

    /// <summary>
    /// Loads user data and permissions from the database.
    /// Uses bootstrap service to auto-create user if not exists.
    /// </summary>
    private async Task LoadUserAsync()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User == null) return;

        // Extract Firebase UID and email from claims
        var firebaseUid = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst("user_id")?.Value;

        var emailFromClaims = httpContext.User.FindFirst(ClaimTypes.Email)?.Value
            ?? httpContext.User.FindFirst("email")?.Value;

        if (string.IsNullOrEmpty(firebaseUid))
        {
            _logger.LogWarning("No Firebase UID found in claims");
            return;
        }

        if (string.IsNullOrEmpty(emailFromClaims))
        {
            _logger.LogWarning("No email found in claims for FirebaseUid: {FirebaseUid}", firebaseUid);
            return;
        }

        // Bootstrap service ensures user exists and handles root admin role assignment
        var fullName = httpContext.User.FindFirst("name")?.Value;
        var platformUser = await _bootstrapService.EnsurePlatformUserAsync(
            firebaseUid,
            emailFromClaims,
            fullName);

        _userId = platformUser.Id;
        _email = platformUser.Email;

        // Load platform roles and permissions (with caching)
        await LoadPlatformRolesAndPermissionsAsync(platformUser.Id);

        // Load tenant roles and permissions if tenant context is set
        if (_tenantContext.HasTenant)
        {
            await LoadTenantRolesAndPermissionsAsync(platformUser.Id, _tenantContext.TenantId!.Value);
        }
    }

    /// <summary>
    /// Loads platform roles and permissions with caching.
    /// </summary>
    private async Task LoadPlatformRolesAndPermissionsAsync(Guid platformUserId)
    {
        var cacheKey = $"platform:perm:{platformUserId}";

        if (_cache.TryGetValue(cacheKey, out (List<string> Roles, List<string> Permissions) cached))
        {
            _platformRoles = cached.Roles;
            _platformPermissions = cached.Permissions;
            return;
        }

        // Load roles
        var roles = await _platformDbContext.PlatformUserRolesSet
            .AsNoTracking()
            .Where(ur => ur.PlatformUserId == platformUserId && ur.IsActive)
            .Join(_platformDbContext.PlatformRolesSet.Where(r => r.IsActive),
                ur => ur.PlatformRoleId,
                r => r.Id,
                (ur, r) => r.Code)
            .ToListAsync();

        // Load permissions through roles
        var roleIds = await _platformDbContext.PlatformUserRolesSet
            .AsNoTracking()
            .Where(ur => ur.PlatformUserId == platformUserId && ur.IsActive)
            .Select(ur => ur.PlatformRoleId)
            .ToListAsync();

        var permissions = await _platformDbContext.PlatformRolePermissionsSet
            .AsNoTracking()
            .Where(rp => roleIds.Contains(rp.PlatformRoleId) && rp.IsActive)
            .Join(_platformDbContext.PermissionsSet.Where(p => p.IsActive),
                rp => rp.PermissionId,
                p => p.Id,
                (rp, p) => p.Key)
            .Distinct()
            .ToListAsync();

        _platformRoles = roles;
        _platformPermissions = permissions;

        // Cache the results
        _cache.Set(cacheKey, (roles, permissions), PermissionCacheDuration);

        _logger.LogDebug(
            "Loaded {RoleCount} platform roles and {PermissionCount} permissions for user {UserId}",
            roles.Count, permissions.Count, platformUserId);
    }

    /// <summary>
    /// Loads tenant roles and permissions with caching.
    /// </summary>
    private async Task LoadTenantRolesAndPermissionsAsync(Guid platformUserId, Guid tenantId)
    {
        var cacheKey = $"{tenantId}:perm:{platformUserId}";

        if (_cache.TryGetValue(cacheKey, out (List<string> Roles, List<string> Permissions) cached))
        {
            _tenantRoles = cached.Roles;
            _tenantPermissions = cached.Permissions;
            return;
        }

        try
        {
            // Get TenantDbContext via factory
            var tenantDbContext = (TenantDbContext)await _tenantDbContextFactory.CreateAsync(tenantId);

            // Find CommunityUser by PlatformUserId
            var communityUser = await tenantDbContext.CommunityUsers
                .AsNoTracking()
                .Where(cu => cu.PlatformUserId == platformUserId && cu.IsActive)
                .Select(cu => new { cu.Id })
                .FirstOrDefaultAsync();

            if (communityUser == null)
            {
                _logger.LogDebug(
                    "CommunityUser not found for PlatformUserId {PlatformUserId} in tenant {TenantId}",
                    platformUserId, tenantId);
                _tenantRoles = Array.Empty<string>();
                _tenantPermissions = Array.Empty<string>();
                return;
            }

            // Load roles
            var roles = await tenantDbContext.CommunityUserRoleGroups
                .AsNoTracking()
                .Where(curg => curg.CommunityUserId == communityUser.Id && curg.IsActive)
                .Join(tenantDbContext.RoleGroups.Where(rg => rg.IsActive),
                    curg => curg.RoleGroupId,
                    rg => rg.Id,
                    (curg, rg) => rg.Code)
                .ToListAsync();

            // Load permissions through role groups
            var roleGroupIds = await tenantDbContext.CommunityUserRoleGroups
                .AsNoTracking()
                .Where(curg => curg.CommunityUserId == communityUser.Id && curg.IsActive)
                .Select(curg => curg.RoleGroupId)
                .ToListAsync();

            var permissions = await tenantDbContext.RoleGroupPermissions
                .AsNoTracking()
                .Where(rgp => roleGroupIds.Contains(rgp.RoleGroupId) && rgp.IsActive)
                .Select(rgp => rgp.PermissionKey)
                .Distinct()
                .ToListAsync();

            _tenantRoles = roles;
            _tenantPermissions = permissions;

            // Cache the results
            _cache.Set(cacheKey, (roles, permissions), PermissionCacheDuration);

            _logger.LogDebug(
                "Loaded {RoleCount} tenant roles and {PermissionCount} permissions for user {UserId} in tenant {TenantId}",
                roles.Count, permissions.Count, platformUserId, tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to load tenant permissions for user {UserId} in tenant {TenantId}",
                platformUserId, tenantId);

            _tenantRoles = Array.Empty<string>();
            _tenantPermissions = Array.Empty<string>();
        }
    }
}

