using Savi.Domain.Platform.Enums;

namespace Savi.Application.Platform.Ads.Serving.Dtos;

/// <summary>
/// DTO for a banner ad placement response.
/// </summary>
public sealed record BannerPlacementDto
{
    public AdPlacement Placement { get; init; }
    public BannerCreativeDto? Creative { get; init; }
}

/// <summary>
/// DTO for a banner creative in ad serving.
/// </summary>
public sealed record BannerCreativeDto
{
    public Guid CreativeId { get; init; }
    public Guid CampaignId { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string? Caption { get; init; }
    public CTAType CTAType { get; init; }
    public string? CTAValue { get; init; }
    public string? SizeCode { get; init; }
}

/// <summary>
/// Response DTO for GetBanners query.
/// </summary>
public sealed record GetBannersResponse
{
    public Guid TenantId { get; init; }
    public string Screen { get; init; } = string.Empty;
    public List<BannerPlacementDto> Placements { get; init; } = new();
}

/// <summary>
/// DTO for a story campaign in ad serving.
/// </summary>
public sealed record StoryCampaignDto
{
    public Guid CampaignId { get; init; }
    public string Name { get; init; } = string.Empty;
    public List<StorySlideDto> Slides { get; init; } = new();
}

/// <summary>
/// DTO for a story slide in ad serving.
/// </summary>
public sealed record StorySlideDto
{
    public Guid CreativeId { get; init; }
    public int Sequence { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string? Caption { get; init; }
    public CTAType CTAType { get; init; }
    public string? CTAValue { get; init; }
}

/// <summary>
/// Response DTO for GetStories query.
/// </summary>
public sealed record GetStoriesResponse
{
    public Guid TenantId { get; init; }
    public List<StoryCampaignDto> Campaigns { get; init; } = new();
}

/// <summary>
/// Request DTO for recording an ad event.
/// </summary>
public sealed record AdEventRequest
{
    public Guid CampaignId { get; init; }
    public Guid CreativeId { get; init; }
    public Guid TenantId { get; init; }
    public Guid? UserId { get; init; }
    public string EventType { get; init; } = string.Empty; // "View" or "Click"
    public string? Screen { get; init; }
    public string? Placement { get; init; }
    public DateTime OccurredAt { get; init; }
}

/// <summary>
/// Request DTO for batch recording ad events.
/// </summary>
public sealed record RecordAdEventsRequest
{
    public List<AdEventRequest> Events { get; init; } = new();
}

/// <summary>
/// Response DTO for recording ad events.
/// </summary>
public sealed record RecordAdEventsResponse
{
    public string Status { get; init; } = "ok";
    public int Accepted { get; init; }
    public int Rejected { get; init; }
}
