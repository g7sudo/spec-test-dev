using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Tenant;
using Savi.Infrastructure.Persistence.TenantDb;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds default lookup data for a tenant database.
/// Includes UnitTypes and MaintenanceCategories.
/// </summary>
public class TenantDataSeeder
{
    private readonly TenantDbContext _dbContext;
    private readonly ILogger<TenantDataSeeder> _logger;

    /// <summary>
    /// System user ID used for seeding (Guid.Empty represents system-generated data).
    /// </summary>
    private static readonly Guid SystemUserId = Guid.Empty;

    public TenantDataSeeder(
        TenantDbContext dbContext,
        ILogger<TenantDataSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Seeds all default lookup data for the tenant.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting tenant data seeding...");

        await SeedUnitTypesAsync(cancellationToken);
        await SeedMaintenanceCategoriesAsync(cancellationToken);

        _logger.LogInformation("Tenant data seeding completed");
    }

    /// <summary>
    /// Seeds default unit types.
    /// </summary>
    private async Task SeedUnitTypesAsync(CancellationToken cancellationToken)
    {
        var hasUnitTypes = await _dbContext.UnitTypes.AnyAsync(cancellationToken);
        if (hasUnitTypes)
        {
            _logger.LogDebug("Unit types already exist. Skipping seed.");
            return;
        }

        var unitTypes = new List<UnitType>
        {
            UnitType.Create(
                code: "STUDIO",
                name: "Studio",
                description: "Studio apartment with open floor plan",
                defaultParkingSlots: 1,
                defaultOccupancyLimit: 2,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "1BHK",
                name: "1 BHK",
                description: "One bedroom, hall, and kitchen",
                defaultParkingSlots: 1,
                defaultOccupancyLimit: 3,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "2BHK",
                name: "2 BHK",
                description: "Two bedrooms, hall, and kitchen",
                defaultParkingSlots: 1,
                defaultOccupancyLimit: 4,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "3BHK",
                name: "3 BHK",
                description: "Three bedrooms, hall, and kitchen",
                defaultParkingSlots: 2,
                defaultOccupancyLimit: 6,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "4BHK",
                name: "4 BHK",
                description: "Four bedrooms, hall, and kitchen",
                defaultParkingSlots: 2,
                defaultOccupancyLimit: 8,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "PENTHOUSE",
                name: "Penthouse",
                description: "Luxury penthouse unit",
                defaultParkingSlots: 3,
                defaultOccupancyLimit: 8,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "DUPLEX",
                name: "Duplex",
                description: "Two-story duplex unit",
                defaultParkingSlots: 2,
                defaultOccupancyLimit: 6,
                createdBy: SystemUserId),

            UnitType.Create(
                code: "VILLA",
                name: "Villa",
                description: "Standalone villa unit",
                defaultParkingSlots: 3,
                defaultOccupancyLimit: 10,
                createdBy: SystemUserId)
        };

        _dbContext.UnitTypes.AddRange(unitTypes);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} default unit types", unitTypes.Count);
    }

    /// <summary>
    /// Seeds default maintenance categories.
    /// </summary>
    private async Task SeedMaintenanceCategoriesAsync(CancellationToken cancellationToken)
    {
        var hasCategories = await _dbContext.MaintenanceCategories.AnyAsync(cancellationToken);
        if (hasCategories)
        {
            _logger.LogDebug("Maintenance categories already exist. Skipping seed.");
            return;
        }

        var categories = new List<MaintenanceCategory>
        {
            MaintenanceCategory.Create(
                name: "Electrical",
                code: "ELEC",
                description: "Electrical issues including wiring, outlets, lighting, and circuit breakers",
                displayOrder: 1,
                isDefault: false,
                createdBy: SystemUserId),

            MaintenanceCategory.Create(
                name: "Plumbing",
                code: "PLUMB",
                description: "Plumbing issues including pipes, drains, faucets, and water heaters",
                displayOrder: 2,
                isDefault: false,
                createdBy: SystemUserId),

            MaintenanceCategory.Create(
                name: "HVAC",
                code: "HVAC",
                description: "Heating, ventilation, and air conditioning issues",
                displayOrder: 3,
                isDefault: false,
                createdBy: SystemUserId),

            MaintenanceCategory.Create(
                name: "Appliance",
                code: "APPL",
                description: "Appliance repair and maintenance",
                displayOrder: 4,
                isDefault: false,
                createdBy: SystemUserId),

            MaintenanceCategory.Create(
                name: "General",
                code: "GEN",
                description: "General maintenance requests not covered by other categories",
                displayOrder: 5,
                isDefault: true,
                createdBy: SystemUserId),
               MaintenanceCategory.Create(
                name: "Other",
                code: "OTHER",
                description: "Miscellaneous maintenance requests",
                displayOrder: 99,
                isDefault: true,
                createdBy: SystemUserId),
        };

        _dbContext.MaintenanceCategories.AddRange(categories);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} default maintenance categories", categories.Count);
    }
}
