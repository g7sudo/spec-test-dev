using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Tenant-level role groups that bundle permissions.
/// 
/// Examples: COMMUNITY_ADMIN, MAINTENANCE_MANAGER, RESIDENT, OWNER
/// 
/// RoleGroups are defined per tenant and can have different permission sets
/// across different communities.
/// </summary>
public class RoleGroup : BaseEntity
{
    /// <summary>
    /// Unique code within this tenant (e.g., "COMMUNITY_ADMIN", "RESIDENT").
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Display name for the role group.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Description of what this role group is for.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// The type of role group (System, Staff, Resident, Other).
    /// </summary>
    public RoleGroupType GroupType { get; private set; } = RoleGroupType.Other;

    /// <summary>
    /// Whether this is a built-in system role group (seeded by platform).
    /// </summary>
    public bool IsSystem { get; private set; }

    /// <summary>
    /// Display order for UI purposes.
    /// </summary>
    public int DisplayOrder { get; private set; }

    // Navigation properties
    private readonly List<RoleGroupPermission> _permissions = new();
    public IReadOnlyCollection<RoleGroupPermission> Permissions => _permissions.AsReadOnly();

    private readonly List<CommunityUserRoleGroup> _userRoleGroups = new();
    public IReadOnlyCollection<CommunityUserRoleGroup> UserRoleGroups => _userRoleGroups.AsReadOnly();

    // Private constructor for EF
    private RoleGroup() { }

    /// <summary>
    /// Creates a new role group.
    /// </summary>
    public static RoleGroup Create(
        string code,
        string name,
        string? description = null,
        RoleGroupType groupType = RoleGroupType.Other,
        bool isSystem = false,
        int displayOrder = 0,
        Guid? createdBy = null)
    {
        var roleGroup = new RoleGroup
        {
            Code = code.ToUpperInvariant().Trim(),
            Name = name.Trim(),
            Description = description,
            GroupType = groupType,
            IsSystem = isSystem,
            DisplayOrder = displayOrder
        };

        roleGroup.SetCreatedBy(createdBy);
        return roleGroup;
    }

    /// <summary>
    /// Updates the role group's metadata.
    /// </summary>
    public void Update(
        string name,
        string? description,
        RoleGroupType groupType,
        int displayOrder,
        Guid? updatedBy = null)
    {
        Name = name.Trim();
        Description = description;
        GroupType = groupType;
        DisplayOrder = displayOrder;
        MarkAsUpdated(updatedBy);
    }
}

/// <summary>
/// Type of role group.
/// </summary>
public enum RoleGroupType
{
    /// <summary>Built-in system roles (COMMUNITY_ADMIN, RESIDENT, etc.).</summary>
    System,

    /// <summary>Community staff roles (managers, maintenance, security).</summary>
    Staff,

    /// <summary>Owner/Resident-facing roles.</summary>
    Resident,

    /// <summary>Other custom role groups.</summary>
    Other
}

