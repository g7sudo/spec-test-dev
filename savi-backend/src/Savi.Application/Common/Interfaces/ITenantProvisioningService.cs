namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Abstraction for provisioning tenant databases (create DB + seed defaults).
/// </summary>
public interface ITenantProvisioningService
{
    /// <summary>
    /// Provisions the physical tenant database and seeds default data.
    /// </summary>
    /// <param name="options">Provisioning parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    Task ProvisionTenantAsync(TenantProvisioningOptions options, CancellationToken ct = default);
}

/// <summary>
/// Parameters required to provision a tenant database.
/// </summary>
/// <param name="TenantId">Unique tenant identifier.</param>
/// <param name="TenantCode">Tenant code/slug (for logging paths).</param>
/// <param name="Provider">Database provider (postgresql, sqlserver, sqlite, etc.).</param>
/// <param name="ConnectionString">Connection string to use.</param>
/// <param name="SeedDefaultRbac">Whether to seed default tenant role groups + permissions.</param>
public sealed record TenantProvisioningOptions(
    Guid TenantId,
    string TenantCode,
    string Provider,
    string ConnectionString,
    bool SeedDefaultRbac);

