using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Infrastructure.Persistence.TenantDb;

namespace Savi.Infrastructure.Services;

/// <summary>
/// Service for applying database migrations to tenant databases.
/// </summary>
public class TenantDatabaseMigrator : ITenantDatabaseMigrator
{
    private readonly TenantDbContextFactory _contextFactory;
    private readonly ILogger<TenantDatabaseMigrator> _logger;

    public TenantDatabaseMigrator(
        TenantDbContextFactory contextFactory,
        ILogger<TenantDatabaseMigrator> logger)
    {
        _contextFactory = contextFactory;
        _logger = logger;
    }

    public async Task<List<string>> MigrateTenantDatabaseAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating DbContext for tenant {TenantId}", tenantId);

        // Create tenant-specific DbContext
        var dbContextObj = await _contextFactory.CreateAsync(tenantId, cancellationToken);

        if (dbContextObj is not TenantDbContext dbContext)
        {
            throw new InvalidOperationException($"Expected TenantDbContext but got {dbContextObj?.GetType().Name}");
        }

        // Get pending migrations before applying
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);
        var pendingList = pendingMigrations.ToList();

        _logger.LogInformation("Found {PendingCount} pending migrations for tenant {TenantId}",
            pendingList.Count, tenantId);

        if (pendingList.Any())
        {
            // Apply migrations
            await dbContext.Database.MigrateAsync(cancellationToken);
            _logger.LogInformation("Successfully applied {MigrationCount} migrations for tenant {TenantId}",
                pendingList.Count, tenantId);
        }
        else
        {
            _logger.LogInformation("No pending migrations for tenant {TenantId}", tenantId);
        }

        return pendingList;
    }
}
