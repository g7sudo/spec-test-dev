using Savi.Domain.Common;
using Savi.Domain.Platform.Enums;

namespace Savi.Domain.Platform;

/// <summary>
/// Raw event log for ad analytics.
/// Records impressions (views) and clicks for campaigns and creatives.
/// View events are only recorded after the frontend confirms view-time threshold is met.
/// </summary>
public class AdEvent : BaseEntity
{
    /// <summary>
    /// The campaign this event belongs to.
    /// </summary>
    public Guid CampaignId { get; private set; }

    /// <summary>
    /// The creative that was viewed or clicked.
    /// </summary>
    public Guid CreativeId { get; private set; }

    /// <summary>
    /// The tenant (community) where the event occurred.
    /// </summary>
    public Guid TenantId { get; private set; }

    /// <summary>
    /// Optional: the user who viewed/clicked. Filled if user is logged in.
    /// </summary>
    public Guid? PlatformUserId { get; private set; }

    /// <summary>
    /// Type of event: View or Click.
    /// </summary>
    public AdEventType EventType { get; private set; }

    /// <summary>
    /// When the event occurred on the client.
    /// </summary>
    public DateTime OccurredAt { get; private set; }

    /// <summary>
    /// Screen where the event occurred (e.g., HOME, STORY_VIEWER).
    /// </summary>
    public string? Screen { get; private set; }

    /// <summary>
    /// Placement at time of event (useful for A/B testing).
    /// </summary>
    public AdPlacement? Placement { get; private set; }

    // Navigation properties
    public Campaign? Campaign { get; private set; }
    public CampaignCreative? Creative { get; private set; }
    public Tenant? Tenant { get; private set; }
    public PlatformUser? PlatformUser { get; private set; }

    // Private constructor for EF
    private AdEvent() { }

    /// <summary>
    /// Creates a new ad event.
    /// </summary>
    public static AdEvent Create(
        Guid campaignId,
        Guid creativeId,
        Guid tenantId,
        AdEventType eventType,
        DateTime occurredAt,
        Guid? platformUserId = null,
        string? screen = null,
        AdPlacement? placement = null)
    {
        var adEvent = new AdEvent
        {
            CampaignId = campaignId,
            CreativeId = creativeId,
            TenantId = tenantId,
            PlatformUserId = platformUserId,
            EventType = eventType,
            OccurredAt = occurredAt,
            Screen = screen?.Trim(),
            Placement = placement
        };

        // AdEvents are typically system-generated, so no CreatedBy
        return adEvent;
    }

    /// <summary>
    /// Creates a view event.
    /// </summary>
    public static AdEvent CreateView(
        Guid campaignId,
        Guid creativeId,
        Guid tenantId,
        DateTime occurredAt,
        Guid? platformUserId = null,
        string? screen = null,
        AdPlacement? placement = null)
    {
        return Create(
            campaignId,
            creativeId,
            tenantId,
            AdEventType.View,
            occurredAt,
            platformUserId,
            screen,
            placement);
    }

    /// <summary>
    /// Creates a click event.
    /// </summary>
    public static AdEvent CreateClick(
        Guid campaignId,
        Guid creativeId,
        Guid tenantId,
        DateTime occurredAt,
        Guid? platformUserId = null,
        string? screen = null,
        AdPlacement? placement = null)
    {
        return Create(
            campaignId,
            creativeId,
            tenantId,
            AdEventType.Click,
            occurredAt,
            platformUserId,
            screen,
            placement);
    }
}
