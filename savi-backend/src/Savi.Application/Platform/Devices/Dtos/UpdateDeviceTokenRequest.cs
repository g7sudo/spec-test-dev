namespace Savi.Application.Platform.Devices.Dtos;

/// <summary>
/// Request DTO for updating a device's FCM token.
/// </summary>
public sealed record UpdateDeviceTokenRequest
{
    /// <summary>
    /// The new Firebase Cloud Messaging (FCM) device token.
    /// </summary>
    public string DeviceToken { get; init; } = string.Empty;

    /// <summary>
    /// Optional updated app version.
    /// </summary>
    public string? AppVersion { get; init; }

    /// <summary>
    /// Optional updated OS version.
    /// </summary>
    public string? OsVersion { get; init; }
}
