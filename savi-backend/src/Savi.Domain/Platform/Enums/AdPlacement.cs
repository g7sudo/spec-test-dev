namespace Savi.Domain.Platform.Enums;

/// <summary>
/// Where an ad creative can be displayed in the app.
/// </summary>
public enum AdPlacement
{
    /// <summary>
    /// Top section of the home screen.
    /// </summary>
    HomeTop,

    /// <summary>
    /// Middle section of the home screen.
    /// </summary>
    HomeMiddle,

    /// <summary>
    /// Bottom section of the home screen.
    /// </summary>
    HomeBottom,

    /// <summary>
    /// Story tray or story viewer.
    /// </summary>
    StoryFeed,

    /// <summary>
    /// Visitor screen placement (future use).
    /// </summary>
    VisitorsFlow
}
