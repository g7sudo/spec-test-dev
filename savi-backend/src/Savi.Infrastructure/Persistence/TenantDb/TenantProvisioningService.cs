using System;
using System.IO;
using System.Linq;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Authorization;

namespace Savi.Infrastructure.Persistence.TenantDb;

/// <summary>
/// Creates tenant databases and seeds default tenant-level RBAC data.
/// </summary>
public class TenantProvisioningService : ITenantProvisioningService
{
    private readonly ILogger<TenantProvisioningService> _logger;

    public TenantProvisioningService(ILogger<TenantProvisioningService> logger)
    {
        _logger = logger;
    }

    public async Task ProvisionTenantAsync(
        TenantProvisioningOptions options,
        CancellationToken ct = default)
    {
        using var tenantDbContext = CreateTenantDbContext(options.Provider, options.ConnectionString);

        await EnsureDatabaseSchemaAsync(tenantDbContext, options, ct);

        if (!options.SeedDefaultRbac)
        {
            _logger.LogInformation(
                "Skipping tenant RBAC seeding for {TenantCode} (SeedDefaultRbac disabled).",
                options.TenantCode);
            return;
        }

        var alreadySeeded = await tenantDbContext.RoleGroups.AnyAsync(ct);
        if (alreadySeeded)
        {
            _logger.LogInformation(
                "Tenant {TenantCode} already has role groups. Skipping RBAC seed.",
                options.TenantCode);
            return;
        }

        var communityAdmin = RoleGroup.Create(
            code: "COMMUNITY_ADMIN",
            name: "Community Admin",
            description: "Full control over tenant configuration and modules.",
            groupType: RoleGroupType.System,
            isSystem: true,
            displayOrder: 1);

        tenantDbContext.RoleGroups.Add(communityAdmin);

        var tenantPermissionKeys = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .Select(p => p.Key)
            .Distinct()
            .ToList();

        foreach (var permissionKey in tenantPermissionKeys)
        {
            tenantDbContext.RoleGroupPermissions.Add(
                RoleGroupPermission.Create(communityAdmin.Id, permissionKey));
        }

        await tenantDbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Seeded COMMUNITY_ADMIN role with {PermissionCount} permissions for tenant {TenantCode}",
            tenantPermissionKeys.Count,
            options.TenantCode);
    }

    private static TenantDbContext CreateTenantDbContext(string provider, string connectionString)
    {
        var optionsBuilder = new DbContextOptionsBuilder<TenantDbContext>();

        switch (provider.ToLowerInvariant())
        {
            case "sqlite":
                var sqliteConnectionString = NormalizeSqliteConnectionString(connectionString);
                EnsureSqliteDirectory(sqliteConnectionString);
                optionsBuilder.UseSqlite(sqliteConnectionString);
                break;

            case "sqlserver":
            case "mssql":
                optionsBuilder.UseSqlServer(connectionString);
                break;

            case "postgresql":
            case "postgres":
            case "npgsql":
            default:
                optionsBuilder.UseNpgsql(connectionString);
                break;
        }

        return new TenantDbContext(optionsBuilder.Options);
    }

    private static string NormalizeSqliteConnectionString(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (!Path.IsPathRooted(builder.DataSource))
        {
            var baseDir = AppContext.BaseDirectory ?? Directory.GetCurrentDirectory();
            builder.DataSource = Path.GetFullPath(Path.Combine(baseDir, builder.DataSource));
        }

        return builder.ToString();
    }

    private static void EnsureSqliteDirectory(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (string.IsNullOrWhiteSpace(builder.DataSource))
        {
            return;
        }

        var directory = Path.GetDirectoryName(builder.DataSource);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }

    private async Task EnsureDatabaseSchemaAsync(
        TenantDbContext tenantDbContext,
        TenantProvisioningOptions options,
        CancellationToken ct)
    {
        var hasMigrations = tenantDbContext.Database.GetMigrations().Any();

        if (!hasMigrations)
        {
            await tenantDbContext.Database.EnsureCreatedAsync(ct);
            _logger.LogInformation(
                "No tenant migrations configured. EnsureCreated applied for {TenantCode}",
                options.TenantCode);
            return;
        }

        try
        {
            await tenantDbContext.Database.MigrateAsync(ct);
            _logger.LogInformation(
                "Applied tenant migrations for {TenantCode}",
                options.TenantCode);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("No migrations were found", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning(
                ex,
                "No tenant migrations found. Falling back to EnsureCreated for {TenantCode}",
                options.TenantCode);

            await tenantDbContext.Database.EnsureCreatedAsync(ct);
        }
    }
}

