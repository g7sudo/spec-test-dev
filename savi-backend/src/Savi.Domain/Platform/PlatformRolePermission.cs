using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Join entity linking PlatformRole to Permission.
/// Defines which permissions are granted by each platform role.
/// </summary>
public class PlatformRolePermission : BaseEntity
{
    /// <summary>
    /// The platform role that has this permission.
    /// </summary>
    public Guid PlatformRoleId { get; private set; }
    public PlatformRole? PlatformRole { get; private set; }

    /// <summary>
    /// The permission granted to the role.
    /// </summary>
    public Guid PermissionId { get; private set; }
    public Permission? Permission { get; private set; }

    // Private constructor for EF
    private PlatformRolePermission() { }

    /// <summary>
    /// Creates a new platform role permission assignment.
    /// </summary>
    public static PlatformRolePermission Create(
        Guid platformRoleId,
        Guid permissionId,
        Guid? createdBy = null)
    {
        var rolePermission = new PlatformRolePermission
        {
            PlatformRoleId = platformRoleId,
            PermissionId = permissionId
        };

        rolePermission.SetCreatedBy(createdBy);
        return rolePermission;
    }
}

