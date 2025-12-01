using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Savi.Infrastructure.Persistence.Platform;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Orchestrates all database seeding operations.
/// </summary>
public class DatabaseSeeder
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        IServiceProvider serviceProvider,
        ILogger<DatabaseSeeder> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Seeds all required data into the database.
    /// Should be called on application startup.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting database seeding...");

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();

        // Seed permissions first (other seeders depend on them)
        var permissionSeeder = new PermissionSeeder(
            dbContext,
            scope.ServiceProvider.GetRequiredService<ILogger<PermissionSeeder>>());
        await permissionSeeder.SeedAsync(cancellationToken);

        // Seed plans
        var planSeeder = new PlanSeeder(
            dbContext,
            scope.ServiceProvider.GetRequiredService<ILogger<PlanSeeder>>());
        await planSeeder.SeedAsync(cancellationToken);

        // Seed platform roles
        var roleSeeder = new PlatformRoleSeeder(
            dbContext,
            scope.ServiceProvider.GetRequiredService<ILogger<PlatformRoleSeeder>>());
        await roleSeeder.SeedAsync(cancellationToken);

        _logger.LogInformation("Database seeding completed");
    }
}

/// <summary>
/// Extension methods for database seeding.
/// </summary>
public static class DatabaseSeederExtensions
{
    /// <summary>
    /// Registers the database seeder.
    /// </summary>
    public static IServiceCollection AddDatabaseSeeding(this IServiceCollection services)
    {
        services.AddTransient<DatabaseSeeder>();
        return services;
    }

    /// <summary>
    /// Seeds the database on application startup.
    /// </summary>
    public static async Task SeedDatabaseAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync();
    }
}

