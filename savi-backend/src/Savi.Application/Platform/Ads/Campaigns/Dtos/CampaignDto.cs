using Savi.Domain.Platform.Enums;

namespace Savi.Application.Platform.Ads.Campaigns.Dtos;

/// <summary>
/// DTO for campaign data.
/// </summary>
public sealed record CampaignDto
{
    public Guid Id { get; init; }
    public Guid AdvertiserId { get; init; }
    public string AdvertiserName { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public CampaignType Type { get; init; }
    public CampaignStatus Status { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }
    public int? MaxImpressions { get; init; }
    public int? MaxClicks { get; init; }
    public int? DailyImpressionCap { get; init; }
    public int Priority { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int CreativeCount { get; init; }
    public int TargetTenantCount { get; init; }
    public List<Guid> TargetTenantIds { get; init; } = new();
}

/// <summary>
/// DTO for campaign creative data.
/// </summary>
public sealed record CampaignCreativeDto
{
    public Guid Id { get; init; }
    public Guid CampaignId { get; init; }
    public CreativeType Type { get; init; }
    public AdPlacement? Placement { get; init; }
    public string? SizeCode { get; init; }
    public int? Sequence { get; init; }
    public string MediaUrl { get; init; } = string.Empty;
    public string? Caption { get; init; }
    public CTAType CTAType { get; init; }
    public string? CTAValue { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Request DTO for creating a campaign.
/// </summary>
public sealed record CreateCampaignRequest
{
    public Guid AdvertiserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public CampaignType Type { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }
    public int? MaxImpressions { get; init; }
    public int? MaxClicks { get; init; }
    public int? DailyImpressionCap { get; init; }
    public int Priority { get; init; }
    public string? Notes { get; init; }
    public List<Guid> TargetTenantIds { get; init; } = new();
}

/// <summary>
/// Request DTO for updating a campaign.
/// </summary>
public sealed record UpdateCampaignRequest
{
    public string Name { get; init; } = string.Empty;
    public DateTime StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }
    public int? MaxImpressions { get; init; }
    public int? MaxClicks { get; init; }
    public int? DailyImpressionCap { get; init; }
    public int Priority { get; init; }
    public string? Notes { get; init; }
    public List<Guid> TargetTenantIds { get; init; } = new();
}

/// <summary>
/// Request DTO for creating a banner creative.
/// </summary>
public sealed record CreateBannerCreativeRequest
{
    public string MediaUrl { get; init; } = string.Empty;
    public AdPlacement Placement { get; init; }
    public string? SizeCode { get; init; }
    public string? Caption { get; init; }
    public CTAType CTAType { get; init; } = CTAType.None;
    public string? CTAValue { get; init; }
}

/// <summary>
/// Request DTO for creating a story slide creative.
/// </summary>
public sealed record CreateStorySlideRequest
{
    public string MediaUrl { get; init; } = string.Empty;
    public int Sequence { get; init; }
    public string? Caption { get; init; }
    public CTAType CTAType { get; init; } = CTAType.None;
    public string? CTAValue { get; init; }
}

/// <summary>
/// Request DTO for updating campaign status.
/// </summary>
public sealed record UpdateCampaignStatusRequest
{
    public CampaignStatus Status { get; init; }
}
