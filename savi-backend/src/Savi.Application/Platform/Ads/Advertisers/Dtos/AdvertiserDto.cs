namespace Savi.Application.Platform.Ads.Advertisers.Dtos;

/// <summary>
/// DTO for advertiser data.
/// </summary>
public sealed record AdvertiserDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? ContactName { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int CampaignCount { get; init; }
}

/// <summary>
/// Request DTO for creating an advertiser.
/// </summary>
public sealed record CreateAdvertiserRequest
{
    public string Name { get; init; } = string.Empty;
    public string? ContactName { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public string? Notes { get; init; }
}

/// <summary>
/// Request DTO for updating an advertiser.
/// </summary>
public sealed record UpdateAdvertiserRequest
{
    public string Name { get; init; } = string.Empty;
    public string? ContactName { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public string? Notes { get; init; }
}
