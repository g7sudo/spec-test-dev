using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds a default tenant for development purposes.
/// </summary>
public class TenantSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ITenantProvisioningService _provisioningService;
    private readonly ILogger<TenantSeeder> _logger;

    /// <summary>
    /// Default tenant code for development.
    /// </summary>
    public const string DefaultTenantCode = "green-meadows";

    /// <summary>
    /// Default tenant name for development.
    /// </summary>
    public const string DefaultTenantName = "Green Meadows Community";

    public TenantSeeder(
        PlatformDbContext dbContext,
        ITenantProvisioningService provisioningService,
        ILogger<TenantSeeder> logger)
    {
        _dbContext = dbContext;
        _provisioningService = provisioningService;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting tenant seeding...");

        // Check if default tenant already exists
        var existingTenant = await _dbContext.TenantsSet
            .FirstOrDefaultAsync(t => t.Code == DefaultTenantCode, cancellationToken);

        if (existingTenant != null)
        {
            _logger.LogInformation("Default tenant '{TenantCode}' already exists. Skipping seed.", DefaultTenantCode);
            return;
        }

        // Create the default tenant
        var connectionString = $"Data Source=tenants/{DefaultTenantCode}.db";
        var tenant = Tenant.Create(
            name: DefaultTenantName,
            provider: "sqlite",
            connectionString: connectionString,
            code: DefaultTenantCode);

        // Set address info
        tenant.UpdateAddress(
            addressLine1: "123 Green Meadows Drive",
            addressLine2: null,
            city: "Manama",
            state: "Capital",
            country: "Bahrain",
            postalCode: "00000");

        // Set timezone
        tenant.UpdateInfo(
            name: DefaultTenantName,
            code: DefaultTenantCode,
            timezone: "Asia/Bahrain");

        // Set primary contact
        tenant.UpdatePrimaryContact(
            name: "Admin",
            email: "admin@greenmeadows.com",
            phone: "+973 1234 5678");

        _dbContext.TenantsSet.Add(tenant);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created default tenant '{TenantCode}' with ID {TenantId}", DefaultTenantCode, tenant.Id);

        // Provision the tenant database
        await _provisioningService.ProvisionTenantAsync(
            new TenantProvisioningOptions
            {
                TenantId = tenant.Id,
                TenantCode = DefaultTenantCode,
                Provider = "sqlite",
                ConnectionString = connectionString,
                SeedDefaultRbac = true,
                SeedDefaultData = true
            },
            cancellationToken);

        _logger.LogInformation("Provisioned tenant database for '{TenantCode}'", DefaultTenantCode);
    }
}
