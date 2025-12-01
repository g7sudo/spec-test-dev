namespace Savi.SharedKernel.Authorization;

/// <summary>
/// Represents a permission definition with all its metadata.
/// Used for seeding the Permission table in PlatformDB.
/// </summary>
/// <param name="Key">Unique permission key (e.g., TENANT_MAINTENANCE_REQUEST_VIEW).</param>
/// <param name="Scope">Whether this is a Platform or Tenant level permission.</param>
/// <param name="Module">The feature module this permission belongs to (e.g., Maintenance, Visitors).</param>
/// <param name="Action">The specific action (e.g., View, Create, Delete).</param>
/// <param name="Description">Human-readable description of what this permission allows.</param>
public sealed record PermissionDefinition(
    string Key,
    PermissionScope Scope,
    string Module,
    string Action,
    string Description);

/// <summary>
/// Defines whether a permission applies at Platform or Tenant level.
/// </summary>
public enum PermissionScope
{
    /// <summary>
    /// Platform-level permissions for root/admin operations.
    /// </summary>
    Platform,

    /// <summary>
    /// Tenant-level permissions for community-specific operations.
    /// </summary>
    Tenant
}

