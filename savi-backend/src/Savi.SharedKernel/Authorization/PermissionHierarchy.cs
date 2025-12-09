namespace Savi.SharedKernel.Authorization;

/// <summary>
/// Defines permission hierarchies where broader permissions imply narrower ones.
/// Hierarchy: FULL → _UNIT → _OWN
/// Example: TENANT_AMENITY_VIEW implies TENANT_AMENITY_BOOKING_VIEW_UNIT implies TENANT_AMENITY_BOOKING_VIEW_OWN
/// </summary>
public static class PermissionHierarchy
{
    /// <summary>
    /// Maps a permission to the broader permissions that imply it.
    /// Key = target permission, Value = array of permissions that imply the target.
    /// </summary>
    private static readonly Dictionary<string, string[]> ImpliedBy = new()
    {
        // Amenity Booking permissions hierarchy
        // VIEW hierarchy: VIEW → VIEW_UNIT → VIEW_OWN
        [Permissions.Tenant.Amenities.BookingViewOwn] = new[]
        {
            Permissions.Tenant.Amenities.View,
            Permissions.Tenant.Amenities.Manage,
            Permissions.Tenant.Amenities.BookingViewUnit
        },
        [Permissions.Tenant.Amenities.BookingViewUnit] = new[]
        {
            Permissions.Tenant.Amenities.View,
            Permissions.Tenant.Amenities.Manage
        },

        // CREATE hierarchy: BOOK → CREATE_UNIT → CREATE_OWN
        [Permissions.Tenant.Amenities.BookingCreateOwn] = new[]
        {
            Permissions.Tenant.Amenities.Book,
            Permissions.Tenant.Amenities.Manage,
            Permissions.Tenant.Amenities.BookingCreateUnit
        },
        [Permissions.Tenant.Amenities.BookingCreateUnit] = new[]
        {
            Permissions.Tenant.Amenities.Book,
            Permissions.Tenant.Amenities.Manage
        },

        // MANAGE hierarchy: BOOK/MANAGE → MANAGE_UNIT → MANAGE_OWN
        [Permissions.Tenant.Amenities.BookingManageOwn] = new[]
        {
            Permissions.Tenant.Amenities.Book,
            Permissions.Tenant.Amenities.Manage,
            Permissions.Tenant.Amenities.BookingManageUnit
        },
        [Permissions.Tenant.Amenities.BookingManageUnit] = new[]
        {
            Permissions.Tenant.Amenities.Book,
            Permissions.Tenant.Amenities.Manage
        },

        // Visitor permissions hierarchy
        // VIEW hierarchy: VIEW → VIEW_UNIT → VIEW_OWN
        [Permissions.Tenant.Visitors.ViewOwn] = new[]
        {
            Permissions.Tenant.Visitors.View,
            Permissions.Tenant.Visitors.Manage,
            Permissions.Tenant.Visitors.ViewUnit
        },
        [Permissions.Tenant.Visitors.ViewUnit] = new[]
        {
            Permissions.Tenant.Visitors.View,
            Permissions.Tenant.Visitors.Manage
        },

        // CREATE hierarchy: CREATE → CREATE_UNIT → CREATE_OWN
        [Permissions.Tenant.Visitors.CreateOwn] = new[]
        {
            Permissions.Tenant.Visitors.Create,
            Permissions.Tenant.Visitors.Manage,
            Permissions.Tenant.Visitors.CreateUnit
        },
        [Permissions.Tenant.Visitors.CreateUnit] = new[]
        {
            Permissions.Tenant.Visitors.Create,
            Permissions.Tenant.Visitors.Manage
        },

        // MANAGE hierarchy: MANAGE → MANAGE_UNIT → MANAGE_OWN
        [Permissions.Tenant.Visitors.ManageOwn] = new[]
        {
            Permissions.Tenant.Visitors.Manage,
            Permissions.Tenant.Visitors.ManageUnit
        },
        [Permissions.Tenant.Visitors.ManageUnit] = new[]
        {
            Permissions.Tenant.Visitors.Manage
        },

        // Maintenance Request permissions hierarchy
        // VIEW hierarchy: VIEW → VIEW_UNIT → VIEW_OWN
        [Permissions.Tenant.Maintenance.RequestViewOwn] = new[]
        {
            Permissions.Tenant.Maintenance.RequestView,
            Permissions.Tenant.Maintenance.RequestManage,
            Permissions.Tenant.Maintenance.RequestViewUnit
        },
        [Permissions.Tenant.Maintenance.RequestViewUnit] = new[]
        {
            Permissions.Tenant.Maintenance.RequestView,
            Permissions.Tenant.Maintenance.RequestManage
        },

        // CREATE hierarchy: CREATE → CREATE_UNIT → CREATE_OWN
        [Permissions.Tenant.Maintenance.RequestCreateOwn] = new[]
        {
            Permissions.Tenant.Maintenance.RequestCreate,
            Permissions.Tenant.Maintenance.RequestManage,
            Permissions.Tenant.Maintenance.RequestCreateUnit
        },
        [Permissions.Tenant.Maintenance.RequestCreateUnit] = new[]
        {
            Permissions.Tenant.Maintenance.RequestCreate,
            Permissions.Tenant.Maintenance.RequestManage
        },
    };

    /// <summary>
    /// Checks if the user has the target permission, either directly or via a permission that implies it.
    /// </summary>
    /// <param name="userPermissions">The user's permissions.</param>
    /// <param name="targetPermission">The permission to check for.</param>
    /// <returns>True if user has the permission directly or via hierarchy.</returns>
    public static bool HasPermissionOrImplied(
        IReadOnlyCollection<string> userPermissions,
        string targetPermission)
    {
        // Direct permission check
        if (userPermissions.Contains(targetPermission))
            return true;

        // Check if any broader permission implies this one
        if (ImpliedBy.TryGetValue(targetPermission, out var impliedByPermissions))
        {
            return impliedByPermissions.Any(userPermissions.Contains);
        }

        return false;
    }

    /// <summary>
    /// Gets all permissions that imply the target permission.
    /// </summary>
    /// <param name="targetPermission">The target permission.</param>
    /// <returns>Array of permissions that imply the target, or empty array if none.</returns>
    public static string[] GetImplyingPermissions(string targetPermission)
    {
        return ImpliedBy.TryGetValue(targetPermission, out var permissions)
            ? permissions
            : Array.Empty<string>();
    }

    /// <summary>
    /// Gets the highest level permission the user has from the given hierarchy.
    /// Returns null if user has none of the permissions.
    /// </summary>
    /// <param name="userPermissions">The user's permissions.</param>
    /// <param name="fullPermission">The full/admin level permission.</param>
    /// <param name="unitPermission">The unit level permission.</param>
    /// <param name="ownPermission">The own/self level permission.</param>
    /// <returns>The highest level permission or null.</returns>
    public static string? GetHighestPermissionLevel(
        IReadOnlyCollection<string> userPermissions,
        string fullPermission,
        string? unitPermission,
        string? ownPermission)
    {
        if (userPermissions.Contains(fullPermission))
            return fullPermission;

        if (unitPermission != null && userPermissions.Contains(unitPermission))
            return unitPermission;

        if (ownPermission != null && userPermissions.Contains(ownPermission))
            return ownPermission;

        return null;
    }
}
