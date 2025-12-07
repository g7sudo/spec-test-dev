using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.Infrastructure.Persistence.Platform;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds sample ads data for development and testing purposes.
/// Creates advertisers, campaigns, creatives, and sample analytics events.
/// </summary>
public class AdsSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ILogger<AdsSeeder> _logger;

    // Placeholder image URLs with various sizes
    private const string BannerLarge = "https://placehold.co/600x200@2x.png";
    private const string BannerMedium = "https://placehold.co/600x150@2x.png";
    private const string BannerSmall = "https://placehold.co/600x100@2x.png";
    private const string StorySlide = "https://placehold.co/400x700@2x.png";
    private const string StorySlideAlt = "https://placehold.co/400x600@2x.png";

    public AdsSeeder(
        PlatformDbContext dbContext,
        ILogger<AdsSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting ads seeding...");

        // Check if ads data already exists
        var existingAdvertisers = await _dbContext.AdvertisersSet.AnyAsync(cancellationToken);
        if (existingAdvertisers)
        {
            _logger.LogInformation("Ads data already exists. Skipping seed.");
            return;
        }

        // Get the default tenant
        var defaultTenant = await _dbContext.TenantsSet
            .FirstOrDefaultAsync(t => t.Code == TenantSeeder.DefaultTenantCode, cancellationToken);

        if (defaultTenant == null)
        {
            _logger.LogWarning("Default tenant not found. Skipping ads seeding.");
            return;
        }

        // Create advertisers
        var advertisers = await SeedAdvertisersAsync(cancellationToken);

        // Create campaigns with creatives
        var campaigns = await SeedCampaignsAsync(advertisers, defaultTenant.Id, cancellationToken);

        // Create sample ad events for analytics
        await SeedAdEventsAsync(campaigns, defaultTenant.Id, cancellationToken);

        _logger.LogInformation("Ads seeding completed successfully");
    }

    private async Task<List<Advertiser>> SeedAdvertisersAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding advertisers...");

        var advertisers = new List<Advertiser>
        {
            Advertiser.Create(
                name: "XYZ Laundry Services",
                contactName: "Mohammed Ali",
                contactEmail: "contact@xyzlaundry.com",
                contactPhone: "+973 1700 1234",
                notes: "Premium laundry partner. Prefers 30-day campaigns with WhatsApp CTA.",
                createdBy: null),

            Advertiser.Create(
                name: "Fresh Mart Grocery",
                contactName: "Sara Ahmed",
                contactEmail: "marketing@freshmart.bh",
                contactPhone: "+973 1700 5678",
                notes: "Local grocery chain. Focus on weekly deals and offers.",
                createdBy: null),

            Advertiser.Create(
                name: "QuickFix Home Services",
                contactName: "Khalid Hassan",
                contactEmail: "ads@quickfix.bh",
                contactPhone: "+973 1700 9012",
                notes: "AC repair, plumbing, electrical. Call CTA preferred.",
                createdBy: null),

            Advertiser.Create(
                name: "Bella Salon & Spa",
                contactName: "Fatima Al-Khalifa",
                contactEmail: "bookings@bellasalon.com",
                contactPhone: "+973 1700 3456",
                notes: "Premium salon. Story campaigns perform well.",
                createdBy: null),

            Advertiser.Create(
                name: "Al Salam Restaurant",
                contactName: "Ahmed Ibrahim",
                contactEmail: "info@alsalam.bh",
                contactPhone: "+973 1700 7890",
                notes: "Local restaurant with delivery. Link CTA to menu.",
                createdBy: null)
        };

        _dbContext.AdvertisersSet.AddRange(advertisers);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} advertisers", advertisers.Count);
        return advertisers;
    }

    private async Task<List<Campaign>> SeedCampaignsAsync(
        List<Advertiser> advertisers,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding campaigns...");

        var campaigns = new List<Campaign>();
        var now = DateTime.UtcNow;

        // Campaign 1: XYZ Laundry - Active Banner Campaign
        var laundryBannerCampaign = Campaign.Create(
            advertiserId: advertisers[0].Id,
            name: "Monsoon Laundry Special",
            type: CampaignType.Banner,
            startsAt: now.AddDays(-15),
            endsAt: now.AddDays(15),
            maxImpressions: 10000,
            maxClicks: null,
            dailyImpressionCap: 500,
            priority: 10,
            notes: "20% off during monsoon season",
            createdBy: null);
        laundryBannerCampaign.UpdateStatus(CampaignStatus.Active, null);
        campaigns.Add(laundryBannerCampaign);

        // Campaign 2: XYZ Laundry - Active Story Campaign
        var laundryStoryCampaign = Campaign.Create(
            advertiserId: advertisers[0].Id,
            name: "Laundry Tips & Offers",
            type: CampaignType.Story,
            startsAt: now.AddDays(-10),
            endsAt: now.AddDays(20),
            maxImpressions: null,
            maxClicks: 500,
            dailyImpressionCap: null,
            priority: 8,
            notes: "Story campaign with laundry tips and special offers",
            createdBy: null);
        laundryStoryCampaign.UpdateStatus(CampaignStatus.Active, null);
        campaigns.Add(laundryStoryCampaign);

        // Campaign 3: Fresh Mart - Active Banner Campaign
        var groceryBannerCampaign = Campaign.Create(
            advertiserId: advertisers[1].Id,
            name: "Weekend Fresh Deals",
            type: CampaignType.Banner,
            startsAt: now.AddDays(-5),
            endsAt: now.AddDays(25),
            maxImpressions: 15000,
            maxClicks: null,
            dailyImpressionCap: 1000,
            priority: 15,
            notes: "Weekend grocery specials - highest priority",
            createdBy: null);
        groceryBannerCampaign.UpdateStatus(CampaignStatus.Active, null);
        campaigns.Add(groceryBannerCampaign);

        // Campaign 4: QuickFix - Active Banner Campaign
        var repairBannerCampaign = Campaign.Create(
            advertiserId: advertisers[2].Id,
            name: "Summer AC Service",
            type: CampaignType.Banner,
            startsAt: now.AddDays(-20),
            endsAt: now.AddDays(10),
            maxImpressions: 8000,
            maxClicks: 300,
            dailyImpressionCap: 400,
            priority: 5,
            notes: "AC service campaign for summer",
            createdBy: null);
        repairBannerCampaign.UpdateStatus(CampaignStatus.Active, null);
        campaigns.Add(repairBannerCampaign);

        // Campaign 5: Bella Salon - Active Story Campaign
        var salonStoryCampaign = Campaign.Create(
            advertiserId: advertisers[3].Id,
            name: "Summer Glow Package",
            type: CampaignType.Story,
            startsAt: now.AddDays(-7),
            endsAt: now.AddDays(23),
            maxImpressions: null,
            maxClicks: null,
            dailyImpressionCap: null,
            priority: 12,
            notes: "Premium spa package with multiple story slides",
            createdBy: null);
        salonStoryCampaign.UpdateStatus(CampaignStatus.Active, null);
        campaigns.Add(salonStoryCampaign);

        // Campaign 6: Al Salam Restaurant - Paused Campaign
        var restaurantCampaign = Campaign.Create(
            advertiserId: advertisers[4].Id,
            name: "Ramadan Iftar Special",
            type: CampaignType.Banner,
            startsAt: now.AddDays(-30),
            endsAt: now.AddDays(-1),
            maxImpressions: 20000,
            maxClicks: null,
            dailyImpressionCap: 800,
            priority: 20,
            notes: "Ramadan campaign - ended",
            createdBy: null);
        restaurantCampaign.UpdateStatus(CampaignStatus.Ended, null);
        campaigns.Add(restaurantCampaign);

        // Campaign 7: Fresh Mart - Draft Campaign (future)
        var groceryFutureCampaign = Campaign.Create(
            advertiserId: advertisers[1].Id,
            name: "Back to School Supplies",
            type: CampaignType.Story,
            startsAt: now.AddDays(30),
            endsAt: now.AddDays(60),
            maxImpressions: null,
            maxClicks: null,
            dailyImpressionCap: null,
            priority: 10,
            notes: "Upcoming back to school campaign",
            createdBy: null);
        // Keep as Draft
        campaigns.Add(groceryFutureCampaign);

        _dbContext.CampaignsSet.AddRange(campaigns);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Add target tenants for all campaigns
        foreach (var campaign in campaigns)
        {
            var targetTenant = CampaignTargetTenant.Create(campaign.Id, tenantId, null);
            _dbContext.CampaignTargetTenantsSet.Add(targetTenant);
        }
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Add creatives
        await SeedCreativesAsync(campaigns, cancellationToken);

        _logger.LogInformation("Created {Count} campaigns", campaigns.Count);
        return campaigns;
    }

    private async Task SeedCreativesAsync(List<Campaign> campaigns, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding campaign creatives...");

        var creatives = new List<CampaignCreative>();

        // Campaign 1: Laundry Banner - Multiple placements
        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[0].Id,
            placement: AdPlacement.HomeTop,
            sizeCode: "HOME_LARGE",
            mediaUrl: BannerLarge,
            caption: "20% OFF Laundry Services - Monsoon Special!",
            ctaType: CTAType.WhatsApp,
            ctaValue: "https://wa.me/97317001234?text=Hi,%20I'm%20interested%20in%20the%20monsoon%20offer",
            createdBy: null));

        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[0].Id,
            placement: AdPlacement.HomeMiddle,
            sizeCode: "HOME_MEDIUM",
            mediaUrl: BannerMedium,
            caption: "Free Pickup & Delivery",
            ctaType: CTAType.WhatsApp,
            ctaValue: "https://wa.me/97317001234",
            createdBy: null));

        // Campaign 2: Laundry Story - 4 slides
        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[1].Id,
            sequence: 1,
            mediaUrl: StorySlide,
            caption: "XYZ Laundry - Your Trusted Partner",
            ctaType: CTAType.None,
            ctaValue: null,
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[1].Id,
            sequence: 2,
            mediaUrl: StorySlideAlt,
            caption: "Tip: Separate whites and colors for best results",
            ctaType: CTAType.None,
            ctaValue: null,
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[1].Id,
            sequence: 3,
            mediaUrl: StorySlide,
            caption: "Special Offer: 20% OFF this week!",
            ctaType: CTAType.WhatsApp,
            ctaValue: "https://wa.me/97317001234",
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[1].Id,
            sequence: 4,
            mediaUrl: StorySlideAlt,
            caption: "Book Now - Free Pickup!",
            ctaType: CTAType.WhatsApp,
            ctaValue: "https://wa.me/97317001234?text=Book%20pickup",
            createdBy: null));

        // Campaign 3: Fresh Mart Banner
        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[2].Id,
            placement: AdPlacement.HomeTop,
            sizeCode: "HOME_LARGE",
            mediaUrl: BannerLarge,
            caption: "Weekend Fresh Deals - Up to 40% OFF!",
            ctaType: CTAType.Link,
            ctaValue: "https://freshmart.bh/deals",
            createdBy: null));

        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[2].Id,
            placement: AdPlacement.HomeBottom,
            sizeCode: "HOME_SMALL",
            mediaUrl: BannerSmall,
            caption: "Shop Now - Free Delivery over BD 10",
            ctaType: CTAType.Link,
            ctaValue: "https://freshmart.bh",
            createdBy: null));

        // Campaign 4: QuickFix Banner
        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[3].Id,
            placement: AdPlacement.HomeMiddle,
            sizeCode: "HOME_MEDIUM",
            mediaUrl: BannerMedium,
            caption: "AC Not Cooling? Call QuickFix!",
            ctaType: CTAType.Call,
            ctaValue: "+97317009012",
            createdBy: null));

        // Campaign 5: Bella Salon Story - 5 slides
        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[4].Id,
            sequence: 1,
            mediaUrl: StorySlide,
            caption: "Bella Salon & Spa",
            ctaType: CTAType.None,
            ctaValue: null,
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[4].Id,
            sequence: 2,
            mediaUrl: StorySlideAlt,
            caption: "Introducing Summer Glow Package",
            ctaType: CTAType.None,
            ctaValue: null,
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[4].Id,
            sequence: 3,
            mediaUrl: StorySlide,
            caption: "Facial + Manicure + Pedicure",
            ctaType: CTAType.None,
            ctaValue: null,
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[4].Id,
            sequence: 4,
            mediaUrl: StorySlideAlt,
            caption: "Only BD 35 (Save BD 15!)",
            ctaType: CTAType.WhatsApp,
            ctaValue: "https://wa.me/97317003456?text=Summer%20Glow%20Package",
            createdBy: null));

        creatives.Add(CampaignCreative.CreateStorySlide(
            campaignId: campaigns[4].Id,
            sequence: 5,
            mediaUrl: StorySlide,
            caption: "Book Now - Limited Slots!",
            ctaType: CTAType.Call,
            ctaValue: "+97317003456",
            createdBy: null));

        // Campaign 6: Restaurant (ended) - Banner
        creatives.Add(CampaignCreative.CreateBanner(
            campaignId: campaigns[5].Id,
            placement: AdPlacement.HomeTop,
            sizeCode: "HOME_LARGE",
            mediaUrl: BannerLarge,
            caption: "Iftar Buffet - BD 12 per person",
            ctaType: CTAType.Call,
            ctaValue: "+97317007890",
            createdBy: null));

        _dbContext.CampaignCreativesSet.AddRange(creatives);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} creatives", creatives.Count);
    }

    private async Task SeedAdEventsAsync(
        List<Campaign> campaigns,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding ad events for analytics...");

        // Get the default admin user ID for ad events
        var adminUser = await _dbContext.PlatformUsersSet
            .FirstOrDefaultAsync(u => u.Email == PlatformUserSeeder.DefaultAdminEmail, cancellationToken);

        if (adminUser == null)
        {
            _logger.LogWarning("Default admin user not found. Skipping ad events seeding to avoid FK constraint issues.");
            return;
        }

        var adminUserId = adminUser.Id;
        _logger.LogInformation("Using admin user {UserId} for ad events", adminUserId);

        var events = new List<AdEvent>();
        var random = new Random(42); // Fixed seed for reproducible data
        var now = DateTime.UtcNow;

        // Get all creatives
        var creatives = await _dbContext.CampaignCreativesSet
            .Where(c => campaigns.Select(x => x.Id).Contains(c.CampaignId))
            .ToListAsync(cancellationToken);

        // Generate events for the past 30 days
        for (var dayOffset = -30; dayOffset <= 0; dayOffset++)
        {
            var eventDate = now.AddDays(dayOffset);

            foreach (var campaign in campaigns.Where(c => c.Status == CampaignStatus.Active || c.Status == CampaignStatus.Ended))
            {
                // Skip if campaign wasn't active on this day
                if (eventDate < campaign.StartsAt || (campaign.EndsAt.HasValue && eventDate > campaign.EndsAt.Value))
                    continue;

                var campaignCreatives = creatives.Where(c => c.CampaignId == campaign.Id).ToList();
                if (!campaignCreatives.Any()) continue;

                // Generate varying number of views based on campaign priority
                var baseViews = campaign.Priority * 5 + random.Next(10, 50);
                var viewCount = Math.Max(10, baseViews + random.Next(-20, 20));

                // Distribute views throughout the day
                for (var i = 0; i < viewCount; i++)
                {
                    var creative = campaignCreatives[random.Next(campaignCreatives.Count)];
                    var hourOffset = random.Next(0, 24);
                    var minuteOffset = random.Next(0, 60);
                    var occurredAt = eventDate.Date.AddHours(hourOffset).AddMinutes(minuteOffset);

                    // Create view event
                    var viewEvent = AdEvent.Create(
                        campaignId: campaign.Id,
                        creativeId: creative.Id,
                        tenantId: tenantId,
                        eventType: AdEventType.View,
                        occurredAt: occurredAt,
                        platformUserId: random.Next(100) < 70 ? adminUserId : null, // 70% logged in
                        screen: creative.Type == CreativeType.Banner ? "HOME" : "OFFERS_STORIES",
                        placement: creative.Placement);

                    events.Add(viewEvent);
                }

                // Generate clicks (CTR between 2-8%)
                var clickRate = 0.02 + random.NextDouble() * 0.06;
                var clickCount = (int)(viewCount * clickRate);

                for (var i = 0; i < clickCount; i++)
                {
                    var creative = campaignCreatives[random.Next(campaignCreatives.Count)];
                    var hourOffset = random.Next(0, 24);
                    var minuteOffset = random.Next(0, 60);
                    var occurredAt = eventDate.Date.AddHours(hourOffset).AddMinutes(minuteOffset);

                    // Create click event
                    var clickEvent = AdEvent.Create(
                        campaignId: campaign.Id,
                        creativeId: creative.Id,
                        tenantId: tenantId,
                        eventType: AdEventType.Click,
                        occurredAt: occurredAt,
                        platformUserId: random.Next(100) < 85 ? adminUserId : null, // 85% logged in for clicks
                        screen: creative.Type == CreativeType.Banner ? "HOME" : "OFFERS_STORIES",
                        placement: creative.Placement);

                    events.Add(clickEvent);
                }
            }
        }

        // Batch insert for performance
        const int batchSize = 500;
        for (var i = 0; i < events.Count; i += batchSize)
        {
            var batch = events.Skip(i).Take(batchSize);
            _dbContext.AdEventsSet.AddRange(batch);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("Created {Count} ad events for analytics", events.Count);
    }
}
