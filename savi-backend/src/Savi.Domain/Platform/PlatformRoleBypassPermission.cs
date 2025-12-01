using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Data-driven overrides for platform roles to bypass tenant RBAC for certain permissions.
/// 
/// This allows platform admins/support to access tenant data with specific scopes.
/// For example, a SUPPORT_AGENT might bypass TENANT_MAINTENANCE_REQUEST_VIEW with ReadOnly scope.
/// </summary>
public class PlatformRoleBypassPermission : BaseEntity
{
    /// <summary>
    /// The platform role that has this bypass.
    /// </summary>
    public Guid PlatformRoleId { get; private set; }
    public PlatformRole? PlatformRole { get; private set; }

    /// <summary>
    /// The permission key to bypass (matches Permission.Key or wildcard pattern).
    /// </summary>
    public string PermissionKey { get; private set; } = string.Empty;

    /// <summary>
    /// The scope of the bypass (ReadOnly, ReadWrite, Full).
    /// </summary>
    public BypassScope Scope { get; private set; } = BypassScope.Full;

    // Private constructor for EF
    private PlatformRoleBypassPermission() { }

    /// <summary>
    /// Creates a new bypass permission.
    /// </summary>
    public static PlatformRoleBypassPermission Create(
        Guid platformRoleId,
        string permissionKey,
        BypassScope scope = BypassScope.Full,
        Guid? createdBy = null)
    {
        var bypass = new PlatformRoleBypassPermission
        {
            PlatformRoleId = platformRoleId,
            PermissionKey = permissionKey,
            Scope = scope
        };

        bypass.SetCreatedBy(createdBy);
        return bypass;
    }

    /// <summary>
    /// Updates the bypass scope.
    /// </summary>
    public void UpdateScope(BypassScope scope, Guid? updatedBy = null)
    {
        Scope = scope;
        MarkAsUpdated(updatedBy);
    }
}

/// <summary>
/// Scope of a platform role bypass permission.
/// </summary>
public enum BypassScope
{
    /// <summary>Read-only access to tenant data.</summary>
    ReadOnly,

    /// <summary>Read and write access to tenant data.</summary>
    ReadWrite,

    /// <summary>Full access including administrative operations.</summary>
    Full
}

