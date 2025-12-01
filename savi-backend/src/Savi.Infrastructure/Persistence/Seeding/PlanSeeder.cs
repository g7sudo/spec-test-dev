using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds default Plan rows so new tenants can be created without manual data entry.
/// </summary>
public class PlanSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ILogger<PlanSeeder> _logger;

    public PlanSeeder(
        PlatformDbContext dbContext,
        ILogger<PlanSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var hasPlans = await _dbContext.PlansSet.AnyAsync(cancellationToken);
        if (hasPlans)
        {
            _logger.LogInformation("Plans already exist. Skipping plan seeding.");
            return;
        }

        var plans = new[]
        {
            Plan.Create(
                code: "BASIC",
                name: "Basic",
                description: "Starter tier for pilot communities.",
                maxRequestsPerMinute: 100,
                defaultListingExpiryDays: 15,
                isMarketplaceEnabled: true,
                isCrossCommunityMarketplaceEnabled: false),

            Plan.Create(
                code: "STANDARD",
                name: "Standard",
                description: "Default tier for most communities.",
                maxRequestsPerMinute: 500,
                defaultListingExpiryDays: 30,
                isMarketplaceEnabled: true,
                isCrossCommunityMarketplaceEnabled: false),

            Plan.Create(
                code: "PREMIUM",
                name: "Premium",
                description: "High-volume tier with cross-community marketplace.",
                maxRequestsPerMinute: 2000,
                defaultListingExpiryDays: 45,
                isMarketplaceEnabled: true,
                isCrossCommunityMarketplaceEnabled: true)
        };

        _dbContext.PlansSet.AddRange(plans);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} default plans.", plans.Length);
    }
}

