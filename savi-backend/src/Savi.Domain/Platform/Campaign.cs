using Savi.Domain.Common;
using Savi.Domain.Platform.Enums;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents an advertising campaign. A campaign belongs to an advertiser
/// and contains creatives (banners or story slides) targeted at specific tenants.
/// </summary>
public class Campaign : BaseEntity
{
    /// <summary>
    /// The advertiser who owns this campaign.
    /// </summary>
    public Guid AdvertiserId { get; private set; }

    /// <summary>
    /// Name of the campaign for identification.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Type of campaign: Banner or Story.
    /// </summary>
    public CampaignType Type { get; private set; }

    /// <summary>
    /// Current status of the campaign.
    /// </summary>
    public CampaignStatus Status { get; private set; } = CampaignStatus.Draft;

    /// <summary>
    /// When the campaign starts showing ads.
    /// </summary>
    public DateTime StartsAt { get; private set; }

    /// <summary>
    /// When the campaign ends. Null means it runs indefinitely.
    /// </summary>
    public DateTime? EndsAt { get; private set; }

    /// <summary>
    /// Optional hard cap on total impressions across all tenants.
    /// </summary>
    public int? MaxImpressions { get; private set; }

    /// <summary>
    /// Optional hard cap on total clicks.
    /// </summary>
    public int? MaxClicks { get; private set; }

    /// <summary>
    /// Optional per-day impression cap.
    /// </summary>
    public int? DailyImpressionCap { get; private set; }

    /// <summary>
    /// Priority for serving. Higher values are served first among eligible campaigns.
    /// </summary>
    public int Priority { get; private set; }

    /// <summary>
    /// Internal notes about the campaign.
    /// </summary>
    public string? Notes { get; private set; }

    // Navigation properties
    public Advertiser? Advertiser { get; private set; }
    public ICollection<CampaignTargetTenant> TargetTenants { get; private set; } = new List<CampaignTargetTenant>();
    public ICollection<CampaignCreative> Creatives { get; private set; } = new List<CampaignCreative>();
    public ICollection<AdEvent> Events { get; private set; } = new List<AdEvent>();

    // Private constructor for EF
    private Campaign() { }

    /// <summary>
    /// Creates a new campaign.
    /// </summary>
    public static Campaign Create(
        Guid advertiserId,
        string name,
        CampaignType type,
        DateTime startsAt,
        DateTime? endsAt = null,
        int? maxImpressions = null,
        int? maxClicks = null,
        int? dailyImpressionCap = null,
        int priority = 0,
        string? notes = null,
        Guid? createdBy = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Campaign name is required.", nameof(name));
        }

        if (endsAt.HasValue && endsAt.Value <= startsAt)
        {
            throw new ArgumentException("End date must be after start date.", nameof(endsAt));
        }

        var campaign = new Campaign
        {
            AdvertiserId = advertiserId,
            Name = name.Trim(),
            Type = type,
            Status = CampaignStatus.Draft,
            StartsAt = startsAt,
            EndsAt = endsAt,
            MaxImpressions = maxImpressions,
            MaxClicks = maxClicks,
            DailyImpressionCap = dailyImpressionCap,
            Priority = priority,
            Notes = notes?.Trim()
        };

        campaign.SetCreatedBy(createdBy);
        return campaign;
    }

    /// <summary>
    /// Updates the campaign details.
    /// </summary>
    public void Update(
        string name,
        DateTime startsAt,
        DateTime? endsAt = null,
        int? maxImpressions = null,
        int? maxClicks = null,
        int? dailyImpressionCap = null,
        int priority = 0,
        string? notes = null,
        Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Campaign name is required.", nameof(name));
        }

        if (endsAt.HasValue && endsAt.Value <= startsAt)
        {
            throw new ArgumentException("End date must be after start date.", nameof(endsAt));
        }

        Name = name.Trim();
        StartsAt = startsAt;
        EndsAt = endsAt;
        MaxImpressions = maxImpressions;
        MaxClicks = maxClicks;
        DailyImpressionCap = dailyImpressionCap;
        Priority = priority;
        Notes = notes?.Trim();
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the campaign status.
    /// </summary>
    public void UpdateStatus(CampaignStatus newStatus, Guid? updatedBy = null)
    {
        Status = newStatus;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Activates the campaign.
    /// </summary>
    public void Activate(Guid? updatedBy = null)
    {
        UpdateStatus(CampaignStatus.Active, updatedBy);
    }

    /// <summary>
    /// Pauses the campaign.
    /// </summary>
    public void Pause(Guid? updatedBy = null)
    {
        UpdateStatus(CampaignStatus.Paused, updatedBy);
    }

    /// <summary>
    /// Ends the campaign.
    /// </summary>
    public void End(Guid? updatedBy = null)
    {
        UpdateStatus(CampaignStatus.Ended, updatedBy);
    }

    /// <summary>
    /// Checks if the campaign is currently eligible to serve ads.
    /// </summary>
    public bool IsEligibleToServe(DateTime now)
    {
        if (!IsActive)
            return false;

        if (Status != CampaignStatus.Active)
            return false;

        if (now < StartsAt)
            return false;

        if (EndsAt.HasValue && now > EndsAt.Value)
            return false;

        return true;
    }
}
