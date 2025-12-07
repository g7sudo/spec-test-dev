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
public sealed class TenantProvisioningOptions
{
    /// <summary>Unique tenant identifier.</summary>
    public Guid TenantId { get; init; }

    /// <summary>Tenant code/slug (for logging paths).</summary>
    public string TenantCode { get; init; } = string.Empty;

    /// <summary>Database provider (postgresql, sqlserver, sqlite, etc.).</summary>
    public string Provider { get; init; } = string.Empty;

    /// <summary>Connection string to use.</summary>
    public string ConnectionString { get; init; } = string.Empty;

    /// <summary>Whether to seed default tenant role groups + permissions.</summary>
    public bool SeedDefaultRbac { get; init; } = true;

    /// <summary>Whether to seed default lookup data (UnitTypes, MaintenanceCategories).</summary>
    public bool SeedDefaultData { get; init; } = true;
}

