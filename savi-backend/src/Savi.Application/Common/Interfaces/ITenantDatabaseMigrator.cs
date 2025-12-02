namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Service for applying database migrations to tenant databases.
/// </summary>
public interface ITenantDatabaseMigrator
{
    /// <summary>
    /// Applies pending migrations to a specific tenant database.
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of applied migration names</returns>
    Task<List<string>> MigrateTenantDatabaseAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
