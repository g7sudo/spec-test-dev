namespace Savi.SharedKernel.Interfaces;

/// <summary>
/// Provides access to the current authenticated user's identity and permissions.
/// 
/// This is the ONLY way Application/Domain code should get user identity and permissions.
/// No Application/Domain code is allowed to directly inspect JWT claims or HttpContext.
/// 
/// Implementation lives in Infrastructure/Api and reads from HttpContext.User and ITenantContext.
/// </summary>
public interface ICurrentUser
{
    /// <summary>
    /// The global platform user ID (PlatformUser.Id from PlatformDB).
    /// </summary>
    Guid UserId { get; }

    /// <summary>
    /// The user's email address.
    /// </summary>
    string Email { get; }

    /// <summary>
    /// The currently selected tenant ID (from X-Tenant-Id header or context).
    /// Null if no tenant is selected (platform-only context).
    /// </summary>
    Guid? CurrentTenantId { get; }

    /// <summary>
    /// The tenant-specific user ID (CommunityUser.Id from the tenant database).
    /// Null if no tenant is selected or if the user doesn't exist in the current tenant.
    /// Use this when creating tenant entities that have foreign keys to CommunityUser.
    /// </summary>
    Guid? TenantUserId { get; }

    /// <summary>
    /// Platform-level roles assigned to this user (e.g., PLATFORM_ADMIN, SUPPORT_AGENT).
    /// Loaded from PlatformUserRole -> PlatformRole.Code.
    /// </summary>
    IReadOnlyCollection<string> PlatformRoles { get; }

    /// <summary>
    /// Tenant-level role group codes for the current tenant (e.g., COMMUNITY_ADMIN, RESIDENT).
    /// Loaded from CommunityUserRoleGroup -> RoleGroup.Code.
    /// Empty if no tenant is selected.
    /// </summary>
    IReadOnlyCollection<string> TenantRoles { get; }

    /// <summary>
    /// Platform-level permission keys granted to this user.
    /// Loaded from PlatformUserRole -> PlatformRolePermission -> Permission.Key.
    /// </summary>
    IReadOnlyCollection<string> PlatformPermissions { get; }

    /// <summary>
    /// Tenant-level permission keys granted to this user in the current tenant.
    /// Loaded from CommunityUserRoleGroup -> RoleGroupPermission.PermissionKey.
    /// Empty if no tenant is selected.
    /// </summary>
    IReadOnlyCollection<string> TenantPermissions { get; }

    /// <summary>
    /// Checks if the user has a specific platform-level role.
    /// </summary>
    bool HasPlatformRole(string roleCode);

    /// <summary>
    /// Checks if the user has a specific tenant-level role in the current tenant.
    /// </summary>
    bool HasTenantRole(string roleCode);

    /// <summary>
    /// Checks if the user has a specific platform-level permission.
    /// </summary>
    bool HasPlatformPermission(string permissionKey);

    /// <summary>
    /// Checks if the user has a specific tenant-level permission in the current tenant.
    /// </summary>
    bool HasTenantPermission(string permissionKey);

    /// <summary>
    /// Checks if the user has a specific permission (checks both platform and tenant).
    /// </summary>
    bool HasPermission(string permissionKey);
}

