using Savi.Application.Platform.Commands.SeedTestData;

namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Factory for creating test data seeders.
/// </summary>
public interface ITestDataSeederFactory
{
    /// <summary>
    /// Creates a test data seeder for the given tenant DbContext.
    /// </summary>
    /// <param name="tenantDbContext">The tenant database context.</param>
    /// <returns>A test data seeder instance.</returns>
    ITestDataSeeder Create(object tenantDbContext);
}

/// <summary>
/// Interface for seeding test/demo data in a tenant database.
/// </summary>
public interface ITestDataSeeder
{
    /// <summary>
    /// Seeds test data and returns statistics about what was created.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Statistics about the seeded data.</returns>
    Task<SeedTestDataStats> SeedWithStatsAsync(CancellationToken cancellationToken = default);
}
