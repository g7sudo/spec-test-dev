using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Assigns global permission keys (from PlatformDB.Permission / Permissions static catalog)
/// to tenant role groups.
/// 
/// PermissionKey must match a value from the Permissions static class in SharedKernel.
/// </summary>
public class RoleGroupPermission : BaseEntity
{
    /// <summary>
    /// The role group this permission is assigned to.
    /// </summary>
    public Guid RoleGroupId { get; private set; }
    public RoleGroup? RoleGroup { get; private set; }

    /// <summary>
    /// The permission key (matches Permission.Key in PlatformDB / Permissions static catalog).
    /// </summary>
    public string PermissionKey { get; private set; } = string.Empty;

    // Private constructor for EF
    private RoleGroupPermission() { }

    /// <summary>
    /// Creates a new role group permission assignment.
    /// </summary>
    public static RoleGroupPermission Create(
        Guid roleGroupId,
        string permissionKey,
        Guid? createdBy = null)
    {
        var roleGroupPermission = new RoleGroupPermission
        {
            RoleGroupId = roleGroupId,
            PermissionKey = permissionKey
        };

        roleGroupPermission.SetCreatedBy(createdBy);
        return roleGroupPermission;
    }
}

