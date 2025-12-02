using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Commands.MigrateTenantDatabases;

/// <summary>
/// Handler for migrating all tenant databases.
/// </summary>
public class MigrateTenantDatabasesCommandHandler : IRequestHandler<MigrateTenantDatabasesCommand, Result<MigrationResultDto>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ITenantDatabaseMigrator _tenantDatabaseMigrator;
    private readonly ILogger<MigrateTenantDatabasesCommandHandler> _logger;

    public MigrateTenantDatabasesCommandHandler(
        IPlatformDbContext platformDbContext,
        ITenantDatabaseMigrator tenantDatabaseMigrator,
        ILogger<MigrateTenantDatabasesCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _tenantDatabaseMigrator = tenantDatabaseMigrator;
        _logger = logger;
    }

    public async Task<Result<MigrationResultDto>> Handle(MigrateTenantDatabasesCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting tenant database migrations for all active tenants");

        // Get all active tenants
        var tenants = await _platformDbContext.Tenants
            .Where(t => t.IsActive)
            .Select(t => new { t.Id, t.Code })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {TenantCount} active tenants to migrate", tenants.Count);

        var results = new List<TenantMigrationInfo>();
        int successCount = 0;
        int failCount = 0;

        foreach (var tenant in tenants)
        {
            try
            {
                _logger.LogInformation("Migrating database for tenant {TenantCode} ({TenantId})", tenant.Code, tenant.Id);

                // Apply migrations
                var appliedMigrations = await _tenantDatabaseMigrator.MigrateTenantDatabaseAsync(tenant.Id, cancellationToken);

                _logger.LogInformation("Successfully migrated tenant {TenantCode}. Applied {MigrationCount} migrations",
                    tenant.Code, appliedMigrations.Count);

                results.Add(new TenantMigrationInfo
                {
                    TenantId = tenant.Id,
                    TenantCode = tenant.Code,
                    Success = true,
                    AppliedMigrations = appliedMigrations
                });

                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to migrate database for tenant {TenantCode} ({TenantId})", tenant.Code, tenant.Id);

                results.Add(new TenantMigrationInfo
                {
                    TenantId = tenant.Id,
                    TenantCode = tenant.Code,
                    Success = false,
                    ErrorMessage = ex.Message
                });

                failCount++;
            }
        }

        var resultDto = new MigrationResultDto
        {
            TotalTenants = tenants.Count,
            SuccessfulMigrations = successCount,
            FailedMigrations = failCount,
            TenantResults = results
        };

        _logger.LogInformation("Tenant database migration completed. Success: {SuccessCount}, Failed: {FailCount}",
            successCount, failCount);

        return Result<MigrationResultDto>.Success(resultDto);
    }
}
