namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Target type for announcement audience.
/// Determines the scope of who sees the announcement.
/// Maps to DBML: Enum AudienceTargetType
/// </summary>
public enum AudienceTargetType
{
    /// <summary>
    /// Targets the entire community (all residents).
    /// </summary>
    Community,

    /// <summary>
    /// Targets specific block(s) within the community.
    /// </summary>
    Block,

    /// <summary>
    /// Targets specific unit(s).
    /// </summary>
    Unit,

    /// <summary>
    /// Targets specific role group(s) (e.g., Owners, Committee members).
    /// </summary>
    RoleGroup
}
