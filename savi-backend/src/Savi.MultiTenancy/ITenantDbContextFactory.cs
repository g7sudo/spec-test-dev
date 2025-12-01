namespace Savi.MultiTenancy;

/// <summary>
/// Factory for creating tenant-scoped DbContext instances.
/// 
/// Uses PlatformDbContext to look up Tenant.ConnectionString
/// and creates a TenantDbContext configured for that tenant.
/// 
/// Usage:
/// - In API: Use the current ITenantContext to get the tenant ID
/// - In Background Jobs: Pass tenantId explicitly as the first parameter
/// </summary>
public interface ITenantDbContextFactory
{
    /// <summary>
    /// Creates a TenantDbContext for the specified tenant.
    /// </summary>
    /// <param name="tenantId">The tenant ID to create the context for.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A configured TenantDbContext for the specified tenant.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if the tenant does not exist or is not active.
    /// </exception>
    Task<object> CreateAsync(Guid tenantId, CancellationToken ct = default);
}

