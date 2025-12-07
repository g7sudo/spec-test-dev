namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Type of ad event for analytics tracking.
/// </summary>
public enum AdEventType
{
    /// <summary>
    /// Ad was viewed (view threshold met).
    /// </summary>
    View,

    /// <summary>
    /// CTA was tapped/clicked.
    /// </summary>
    Click
}
