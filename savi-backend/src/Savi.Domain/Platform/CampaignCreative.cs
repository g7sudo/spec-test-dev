using Savi.Domain.Common;
using Savi.Domain.Platform.Enums;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents a creative asset within a campaign.
/// Can be a banner variant or a story slide.
/// A Story campaign will have multiple StorySlide creatives with Sequence set.
/// </summary>
public class CampaignCreative : BaseEntity
{
    /// <summary>
    /// The campaign this creative belongs to.
    /// </summary>
    public Guid CampaignId { get; private set; }

    /// <summary>
    /// Type of creative: Banner or StorySlide.
    /// </summary>
    public CreativeType Type { get; private set; }

    /// <summary>
    /// Where this banner can be shown. Only applicable for Banner type.
    /// </summary>
    public AdPlacement? Placement { get; private set; }

    /// <summary>
    /// Logical size key e.g., HOME_LARGE, HOME_SMALL. Only applicable for Banner type.
    /// </summary>
    public string? SizeCode { get; private set; }

    /// <summary>
    /// Ordering for story slides (1..n). Only applicable for StorySlide type.
    /// </summary>
    public int? Sequence { get; private set; }

    /// <summary>
    /// URL to the image or short video clip (10-20sec).
    /// </summary>
    public string MediaUrl { get; private set; } = string.Empty;

    /// <summary>
    /// Optional caption or text overlay.
    /// </summary>
    public string? Caption { get; private set; }

    /// <summary>
    /// Type of call-to-action.
    /// </summary>
    public CTAType CTAType { get; private set; } = CTAType.None;

    /// <summary>
    /// Value for the CTA: phone number, wa.me link, or URL depending on CTAType.
    /// </summary>
    public string? CTAValue { get; private set; }

    // Navigation properties
    public Campaign? Campaign { get; private set; }
    public ICollection<AdEvent> Events { get; private set; } = new List<AdEvent>();

    // Private constructor for EF
    private CampaignCreative() { }

    /// <summary>
    /// Creates a new banner creative.
    /// </summary>
    public static CampaignCreative CreateBanner(
        Guid campaignId,
        string mediaUrl,
        AdPlacement placement,
        string? sizeCode = null,
        string? caption = null,
        CTAType ctaType = CTAType.None,
        string? ctaValue = null,
        Guid? createdBy = null)
    {
        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new ArgumentException("Media URL is required.", nameof(mediaUrl));
        }

        var creative = new CampaignCreative
        {
            CampaignId = campaignId,
            Type = CreativeType.Banner,
            Placement = placement,
            SizeCode = sizeCode?.Trim(),
            MediaUrl = mediaUrl.Trim(),
            Caption = caption?.Trim(),
            CTAType = ctaType,
            CTAValue = ctaValue?.Trim()
        };

        creative.SetCreatedBy(createdBy);
        return creative;
    }

    /// <summary>
    /// Creates a new story slide creative.
    /// </summary>
    public static CampaignCreative CreateStorySlide(
        Guid campaignId,
        string mediaUrl,
        int sequence,
        string? caption = null,
        CTAType ctaType = CTAType.None,
        string? ctaValue = null,
        Guid? createdBy = null)
    {
        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new ArgumentException("Media URL is required.", nameof(mediaUrl));
        }

        if (sequence < 1)
        {
            throw new ArgumentException("Sequence must be 1 or greater.", nameof(sequence));
        }

        var creative = new CampaignCreative
        {
            CampaignId = campaignId,
            Type = CreativeType.StorySlide,
            Placement = AdPlacement.StoryFeed,
            Sequence = sequence,
            MediaUrl = mediaUrl.Trim(),
            Caption = caption?.Trim(),
            CTAType = ctaType,
            CTAValue = ctaValue?.Trim()
        };

        creative.SetCreatedBy(createdBy);
        return creative;
    }

    /// <summary>
    /// Updates a banner creative.
    /// </summary>
    public void UpdateBanner(
        string mediaUrl,
        AdPlacement placement,
        string? sizeCode = null,
        string? caption = null,
        CTAType ctaType = CTAType.None,
        string? ctaValue = null,
        Guid? updatedBy = null)
    {
        if (Type != CreativeType.Banner)
        {
            throw new InvalidOperationException("Cannot update banner properties on a non-banner creative.");
        }

        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new ArgumentException("Media URL is required.", nameof(mediaUrl));
        }

        Placement = placement;
        SizeCode = sizeCode?.Trim();
        MediaUrl = mediaUrl.Trim();
        Caption = caption?.Trim();
        CTAType = ctaType;
        CTAValue = ctaValue?.Trim();
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates a story slide creative.
    /// </summary>
    public void UpdateStorySlide(
        string mediaUrl,
        int sequence,
        string? caption = null,
        CTAType ctaType = CTAType.None,
        string? ctaValue = null,
        Guid? updatedBy = null)
    {
        if (Type != CreativeType.StorySlide)
        {
            throw new InvalidOperationException("Cannot update story slide properties on a non-story-slide creative.");
        }

        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new ArgumentException("Media URL is required.", nameof(mediaUrl));
        }

        if (sequence < 1)
        {
            throw new ArgumentException("Sequence must be 1 or greater.", nameof(sequence));
        }

        Sequence = sequence;
        MediaUrl = mediaUrl.Trim();
        Caption = caption?.Trim();
        CTAType = ctaType;
        CTAValue = ctaValue?.Trim();
        MarkAsUpdated(updatedBy);
    }
}
