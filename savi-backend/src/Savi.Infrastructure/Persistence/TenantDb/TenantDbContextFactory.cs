using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Infrastructure.Persistence.Platform;
using Savi.MultiTenancy;

namespace Savi.Infrastructure.Persistence.TenantDb;

/// <summary>
/// Factory for creating tenant-scoped TenantDbContext instances.
/// 
/// Looks up the tenant's connection string from PlatformDB and creates
/// a TenantDbContext configured for that specific tenant.
/// </summary>
public class TenantDbContextFactory : ITenantDbContextFactory
{
    private readonly PlatformDbContext _platformDbContext;
    private readonly ILogger<TenantDbContextFactory> _logger;

    public TenantDbContextFactory(
        PlatformDbContext platformDbContext,
        ILogger<TenantDbContextFactory> logger)
    {
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<object> CreateAsync(Guid tenantId, CancellationToken ct = default)
    {
        // Look up tenant from PlatformDB
        var tenant = await _platformDbContext.TenantsSet
            .AsNoTracking()
            .Where(t => t.Id == tenantId && t.IsActive)
            .Select(t => new { t.Provider, t.ConnectionString, t.Code })
            .FirstOrDefaultAsync(ct);

        if (tenant == null)
        {
            _logger.LogWarning("Tenant not found or inactive: {TenantId}", tenantId);
            throw new InvalidOperationException($"Tenant {tenantId} not found or is inactive.");
        }

        // Create DbContextOptions for this tenant
        var optionsBuilder = new DbContextOptionsBuilder<TenantDbContext>();

        // Configure based on provider
        switch (tenant.Provider.ToLowerInvariant())
        {
            case "postgres":
            case "postgresql":
            case "npgsql":
                optionsBuilder.UseNpgsql(tenant.ConnectionString);
                break;

            case "sqlserver":
            case "mssql":
                optionsBuilder.UseSqlServer(tenant.ConnectionString);
                break;

            case "sqlite":
                optionsBuilder.UseSqlite(tenant.ConnectionString);
                break;

            default:
                throw new InvalidOperationException($"Unsupported database provider: {tenant.Provider}");
        }

        _logger.LogDebug(
            "Created TenantDbContext for tenant {TenantCode} ({TenantId})",
            tenant.Code,
            tenantId);

        return new TenantDbContext(optionsBuilder.Options);
    }
}

