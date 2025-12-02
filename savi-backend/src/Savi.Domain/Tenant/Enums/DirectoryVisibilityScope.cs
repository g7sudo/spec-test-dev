namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Visibility scope for a user in the community directory.
/// Maps to DBML: Enum DirectoryVisibilityScope
/// </summary>
public enum DirectoryVisibilityScope
{
    /// <summary>
    /// Not shown in directory at all.
    /// </summary>
    Hidden,

    /// <summary>
    /// Visible only to residents in the same block.
    /// </summary>
    BlockOnly,

    /// <summary>
    /// Visible to all residents in this community.
    /// </summary>
    Community
}

