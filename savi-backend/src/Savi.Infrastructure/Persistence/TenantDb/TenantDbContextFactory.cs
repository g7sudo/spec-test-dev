using System.IO;
using Microsoft.Data.Sqlite;
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
                var normalizedConnectionString = NormalizeSqliteConnectionString(tenant.ConnectionString);
                optionsBuilder.UseSqlite(normalizedConnectionString);
                _logger.LogInformation("Using SQLite with connection string: {ConnectionString}", normalizedConnectionString);
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

    /// <summary>
    /// Normalizes SQLite connection string by converting relative paths to absolute paths.
    /// </summary>
    private static string NormalizeSqliteConnectionString(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);

        if (string.IsNullOrWhiteSpace(builder.DataSource))
        {
            return connectionString;
        }

        // If already absolute, return as-is
        if (Path.IsPathRooted(builder.DataSource))
        {
            return connectionString;
        }

        // Convert relative path to absolute
        var baseDir = AppContext.BaseDirectory ?? Directory.GetCurrentDirectory();
        var absolutePath = Path.GetFullPath(Path.Combine(baseDir, builder.DataSource));

        // Ensure directory exists
        var directory = Path.GetDirectoryName(absolutePath);
        if (!string.IsNullOrWhiteSpace(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        builder.DataSource = absolutePath;
        return builder.ToString();
    }
}

