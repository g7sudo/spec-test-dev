namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Status of an advertising campaign.
/// </summary>
public enum CampaignStatus
{
    /// <summary>
    /// Campaign is being prepared, not yet active.
    /// </summary>
    Draft,

    /// <summary>
    /// Campaign is currently running.
    /// </summary>
    Active,

    /// <summary>
    /// Campaign is temporarily paused.
    /// </summary>
    Paused,

    /// <summary>
    /// Campaign has ended (manually or by end date).
    /// </summary>
    Ended
}
