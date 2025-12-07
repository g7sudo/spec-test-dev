namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Type of call-to-action for an ad creative.
/// </summary>
public enum CTAType
{
    /// <summary>
    /// No call-to-action.
    /// </summary>
    None,

    /// <summary>
    /// Opens phone dialer.
    /// </summary>
    Call,

    /// <summary>
    /// Opens WhatsApp chat.
    /// </summary>
    WhatsApp,

    /// <summary>
    /// Opens a generic URL or deep link.
    /// </summary>
    Link
}
