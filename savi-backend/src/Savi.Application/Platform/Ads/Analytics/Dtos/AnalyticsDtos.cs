using Savi.Domain.Platform.Enums;

namespace Savi.Application.Platform.Ads.Analytics.Dtos;

/// <summary>
/// Campaign analytics response with aggregated metrics.
/// </summary>
public sealed class CampaignAnalyticsDto
{
    public Guid CampaignId { get; init; }
    public string CampaignName { get; init; } = string.Empty;
    public CampaignType Type { get; init; }
    public CampaignStatus Status { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }

    // Overall metrics
    public int TotalImpressions { get; init; }
    public int TotalClicks { get; init; }
    public decimal ClickThroughRate { get; init; } // CTR = Clicks / Impressions * 100
    public int UniqueUsers { get; init; }

    // Breakdowns
    public List<TenantAnalyticsDto> ByTenant { get; init; } = new();
    public List<PlacementAnalyticsDto> ByPlacement { get; init; } = new();
    public List<CreativeAnalyticsDto> ByCreative { get; init; } = new();
    public List<DailyAnalyticsDto> ByDate { get; init; } = new();
}

/// <summary>
/// Analytics breakdown by tenant.
/// </summary>
public sealed class TenantAnalyticsDto
{
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
    public int UniqueUsers { get; init; }
}

/// <summary>
/// Analytics breakdown by placement.
/// </summary>
public sealed class PlacementAnalyticsDto
{
    public string Placement { get; init; } = string.Empty;
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
}

/// <summary>
/// Analytics breakdown by creative.
/// </summary>
public sealed class CreativeAnalyticsDto
{
    public Guid CreativeId { get; init; }
    public CreativeType Type { get; init; }
    public string? Placement { get; init; }
    public int? Sequence { get; init; }
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
}

/// <summary>
/// Analytics breakdown by date.
/// </summary>
public sealed class DailyAnalyticsDto
{
    public DateOnly Date { get; init; }
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
}

/// <summary>
/// Advertiser analytics with all campaigns summary.
/// </summary>
public sealed class AdvertiserAnalyticsDto
{
    public Guid AdvertiserId { get; init; }
    public string AdvertiserName { get; init; } = string.Empty;

    // Overall metrics across all campaigns
    public int TotalCampaigns { get; init; }
    public int ActiveCampaigns { get; init; }
    public int TotalImpressions { get; init; }
    public int TotalClicks { get; init; }
    public decimal ClickThroughRate { get; init; }

    // Per-campaign breakdown
    public List<CampaignSummaryDto> Campaigns { get; init; } = new();
}

/// <summary>
/// Campaign summary for advertiser analytics.
/// </summary>
public sealed class CampaignSummaryDto
{
    public Guid CampaignId { get; init; }
    public string Name { get; init; } = string.Empty;
    public CampaignType Type { get; init; }
    public CampaignStatus Status { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
}

/// <summary>
/// Platform-wide analytics overview.
/// </summary>
public sealed class PlatformAnalyticsOverviewDto
{
    public DateTime FromDate { get; init; }
    public DateTime ToDate { get; init; }

    // Overall platform metrics
    public int TotalAdvertisers { get; init; }
    public int TotalCampaigns { get; init; }
    public int ActiveCampaigns { get; init; }
    public int TotalImpressions { get; init; }
    public int TotalClicks { get; init; }
    public decimal ClickThroughRate { get; init; }

    // Top performers
    public List<TopCampaignDto> TopCampaignsByImpressions { get; init; } = new();
    public List<TopCampaignDto> TopCampaignsByClicks { get; init; } = new();
    public List<TopTenantDto> TopTenantsByImpressions { get; init; } = new();

    // Trends
    public List<DailyAnalyticsDto> DailyTrend { get; init; } = new();
}

/// <summary>
/// Top campaign for platform overview.
/// </summary>
public sealed class TopCampaignDto
{
    public Guid CampaignId { get; init; }
    public string CampaignName { get; init; } = string.Empty;
    public string AdvertiserName { get; init; } = string.Empty;
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public decimal ClickThroughRate { get; init; }
}

/// <summary>
/// Top tenant for platform overview.
/// </summary>
public sealed class TopTenantDto
{
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public int Impressions { get; init; }
    public int Clicks { get; init; }
    public int ActiveCampaigns { get; init; }
}
