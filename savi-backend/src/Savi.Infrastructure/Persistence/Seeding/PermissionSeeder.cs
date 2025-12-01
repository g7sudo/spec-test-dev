using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;
using Savi.SharedKernel.Authorization;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeder for the Permission table.
/// Seeds all permissions from Permissions.All().
/// </summary>
public class PermissionSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ILogger<PermissionSeeder> _logger;

    public PermissionSeeder(
        PlatformDbContext dbContext,
        ILogger<PermissionSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Seeds all permissions from Permissions.All() into the database.
    /// Only inserts permissions that don't already exist.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting permission seeding...");

        var allPermissions = Permissions.All().ToList();
        var existingKeys = await _dbContext.PermissionsSet
            .Select(p => p.Key)
            .ToListAsync(cancellationToken);

        var newPermissions = allPermissions
            .Where(p => !existingKeys.Contains(p.Key))
            .Select(p => Permission.Create(
                key: p.Key,
                module: p.Module,
                description: p.Description))
            .ToList();

        if (newPermissions.Count > 0)
        {
            _dbContext.PermissionsSet.AddRange(newPermissions);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Seeded {PermCount} new permissions", newPermissions.Count);
        }
        else
        {
            _logger.LogInformation("No new permissions to seed");
        }
    }
}

