namespace Savi.MultiTenancy;

/// <summary>
/// Provides access to the current tenant context for the request.
/// 
/// Resolved by TenantContextMiddleware from X-Tenant-Id header.
/// All tenant-aware logic must rely on this interface, not parse headers directly.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// The current tenant ID (null if no tenant selected, i.e., platform-only context).
    /// </summary>
    Guid? TenantId { get; }

    /// <summary>
    /// The current tenant's short code (null if no tenant selected).
    /// </summary>
    string? TenantCode { get; }

    /// <summary>
    /// The current tenant's display name (null if no tenant selected).
    /// </summary>
    string? TenantName { get; }

    /// <summary>
    /// Whether a tenant is currently selected.
    /// </summary>
    bool HasTenant { get; }

    /// <summary>
    /// The database provider for this tenant (e.g., "postgres", "sqlserver").
    /// </summary>
    string? Provider { get; }

    /// <summary>
    /// The connection string for this tenant's database.
    /// </summary>
    string? ConnectionString { get; }
}

