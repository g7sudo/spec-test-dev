using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Global permission catalog shared by platform and tenants.
/// 
/// All permission keys are defined in Savi.SharedKernel.Authorization.Permissions.
/// This entity stores the runtime representation in the database.
/// </summary>
public class Permission : BaseEntity
{
    /// <summary>
    /// Unique permission key (e.g., "TENANT_MAINTENANCE_REQUEST_VIEW").
    /// Must match a value from Permissions static class.
    /// </summary>
    public string Key { get; private set; } = string.Empty;

    /// <summary>
    /// The module this permission belongs to (e.g., "Maintenance", "Visitors").
    /// </summary>
    public string Module { get; private set; } = string.Empty;

    /// <summary>
    /// Human-readable description of what this permission allows.
    /// </summary>
    public string? Description { get; private set; }

    // Navigation properties
    private readonly List<PlatformRolePermission> _platformRolePermissions = new();
    public IReadOnlyCollection<PlatformRolePermission> PlatformRolePermissions => _platformRolePermissions.AsReadOnly();

    // Private constructor for EF
    private Permission() { }

    /// <summary>
    /// Creates a new permission.
    /// </summary>
    public static Permission Create(
        string key,
        string module,
        string? description = null,
        Guid? createdBy = null)
    {
        var permission = new Permission
        {
            Key = key,
            Module = module,
            Description = description
        };

        permission.SetCreatedBy(createdBy);
        return permission;
    }

    /// <summary>
    /// Updates the permission's metadata.
    /// </summary>
    public void Update(string module, string? description, Guid? updatedBy = null)
    {
        Module = module;
        Description = description;
        MarkAsUpdated(updatedBy);
    }
}

