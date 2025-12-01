namespace Savi.MultiTenancy;

/// <summary>
/// Default implementation of ITenantContext.
/// 
/// This is a mutable class that gets populated by TenantContextMiddleware
/// and registered as scoped in DI.
/// </summary>
public class TenantContext : ITenantContext
{
    /// <inheritdoc />
    public Guid? TenantId { get; private set; }

    /// <inheritdoc />
    public string? TenantCode { get; private set; }

    /// <inheritdoc />
    public string? TenantName { get; private set; }

    /// <inheritdoc />
    public bool HasTenant => TenantId.HasValue;

    /// <inheritdoc />
    public string? Provider { get; private set; }

    /// <inheritdoc />
    public string? ConnectionString { get; private set; }

    /// <summary>
    /// Sets the tenant context. Called by middleware after resolving tenant.
    /// </summary>
    public void SetTenant(
        Guid tenantId,
        string? tenantCode = null,
        string? tenantName = null,
        string? provider = null,
        string? connectionString = null)
    {
        TenantId = tenantId;
        TenantCode = tenantCode;
        TenantName = tenantName;
        Provider = provider;
        ConnectionString = connectionString;
    }

    /// <summary>
    /// Clears the tenant context (for platform-only operations).
    /// </summary>
    public void Clear()
    {
        TenantId = null;
        TenantCode = null;
        TenantName = null;
        Provider = null;
        ConnectionString = null;
    }
}

