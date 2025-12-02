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
        _logger.LogInformation("TenantDbContextFactory.CreateAsync called with TenantId: {TenantId}", tenantId);

        // Look up tenant from PlatformDB
        _logger.LogInformation("Querying PlatformDB for tenant with ID: {TenantId}", tenantId);
        var tenant = await _platformDbContext.TenantsSet
            .AsNoTracking()
            .Where(t => t.Id == tenantId && t.IsActive)
            .Select(t => new { t.Provider, t.ConnectionString, t.Code })
            .FirstOrDefaultAsync(ct);

        if (tenant == null)
        {
            _logger.LogWarning("Tenant not found or inactive in PlatformDB: {TenantId}", tenantId);
            throw new InvalidOperationException($"Tenant {tenantId} not found or is inactive.");
        }

        _logger.LogInformation(
            "Found tenant in PlatformDB. Code: {TenantCode}, Provider: {Provider}, ConnectionString: {ConnectionString}",
            tenant.Code,
            tenant.Provider,
            tenant.ConnectionString);

        // Create DbContextOptions for this tenant
        var optionsBuilder = new DbContextOptionsBuilder<TenantDbContext>();

        // Configure based on provider
        var providerLower = tenant.Provider.ToLowerInvariant();
        _logger.LogInformation("Configuring DbContext with provider: {Provider}", providerLower);

        switch (providerLower)
        {
            case "postgres":
            case "postgresql":
            case "npgsql":
                optionsBuilder.UseNpgsql(tenant.ConnectionString);
                _logger.LogInformation("Using PostgreSQL with connection string: {ConnectionString}", tenant.ConnectionString);
                break;

            case "sqlserver":
            case "mssql":
                optionsBuilder.UseSqlServer(tenant.ConnectionString);
                _logger.LogInformation("Using SQL Server with connection string: {ConnectionString}", tenant.ConnectionString);
                break;

            case "sqlite":
                optionsBuilder.UseSqlite(tenant.ConnectionString);
                _logger.LogInformation("Using SQLite with connection string: {ConnectionString}", tenant.ConnectionString);
                break;

            default:
                _logger.LogError("Unsupported database provider: {Provider}", tenant.Provider);
                throw new InvalidOperationException($"Unsupported database provider: {tenant.Provider}");
        }

        _logger.LogInformation(
            "Successfully created TenantDbContext for tenant {TenantCode} ({TenantId}) with provider {Provider}",
            tenant.Code,
            tenantId,
            tenant.Provider);

        return new TenantDbContext(optionsBuilder.Options);
    }
}

