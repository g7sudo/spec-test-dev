namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Source of the visitor pass creation.
/// Maps to DBML: Enum VisitorSource
/// </summary>
public enum VisitorSource
{
    /// <summary>
    /// Created by resident/owner via mobile app.
    /// </summary>
    MobileApp,

    /// <summary>
    /// Created by guard at gate.
    /// </summary>
    SecurityApp,

    /// <summary>
    /// Created by admin via web portal.
    /// </summary>
    AdminPortal,

    /// <summary>
    /// Other source.
    /// </summary>
    Other
}
