namespace Savi.Application.Platform.Devices.Dtos;

/// <summary>
/// Request DTO for registering a device.
/// </summary>
public sealed record RegisterDeviceRequest
{
    /// <summary>
    /// Firebase Cloud Messaging (FCM) device token.
    /// </summary>
    public string DeviceToken { get; init; } = string.Empty;

    /// <summary>
    /// Unique identifier for the device (from mobile app).
    /// </summary>
    public string DeviceId { get; init; } = string.Empty;

    /// <summary>
    /// User-friendly name for the device.
    /// </summary>
    public string? DeviceName { get; init; }

    /// <summary>
    /// Platform type: "iOS" or "Android".
    /// </summary>
    public string Platform { get; init; } = string.Empty;

    /// <summary>
    /// Version of the mobile app.
    /// </summary>
    public string? AppVersion { get; init; }

    /// <summary>
    /// Operating system version.
    /// </summary>
    public string? OsVersion { get; init; }
}
