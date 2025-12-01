using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Platform-level roles for platform team members.
/// 
/// Examples: PLATFORM_ADMIN, SUPPORT_AGENT
/// These roles grant platform-level permissions for tenant management, billing, etc.
/// </summary>
public class PlatformRole : BaseEntity
{
    /// <summary>
    /// Unique role code (e.g., "PLATFORM_ADMIN").
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Display name for the role.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Description of what this role is for.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this is a built-in system role (cannot be deleted).
    /// </summary>
    public bool IsSystem { get; private set; } = true;

    // Navigation properties
    private readonly List<PlatformRolePermission> _permissions = new();
    public IReadOnlyCollection<PlatformRolePermission> Permissions => _permissions.AsReadOnly();

    private readonly List<PlatformUserRole> _userRoles = new();
    public IReadOnlyCollection<PlatformUserRole> UserRoles => _userRoles.AsReadOnly();

    private readonly List<PlatformRoleBypassPermission> _bypassPermissions = new();
    public IReadOnlyCollection<PlatformRoleBypassPermission> BypassPermissions => _bypassPermissions.AsReadOnly();

    // Private constructor for EF
    private PlatformRole() { }

    /// <summary>
    /// Creates a new platform role.
    /// </summary>
    public static PlatformRole Create(
        string code,
        string name,
        string? description = null,
        bool isSystem = false,
        Guid? createdBy = null)
    {
        var role = new PlatformRole
        {
            Code = code.ToUpperInvariant().Trim(),
            Name = name.Trim(),
            Description = description,
            IsSystem = isSystem
        };

        role.SetCreatedBy(createdBy);
        return role;
    }

    /// <summary>
    /// Updates the role's metadata.
    /// </summary>
    public void Update(string name, string? description, Guid? updatedBy = null)
    {
        Name = name.Trim();
        Description = description;
        MarkAsUpdated(updatedBy);
    }
}

