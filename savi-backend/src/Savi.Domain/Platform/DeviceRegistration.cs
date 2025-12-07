using Savi.Domain.Common;
using Savi.Domain.Platform.Enums;

namespace Savi.Domain.Platform;

/// <summary>
/// Represents a mobile device registration for push notifications.
///
/// Each PlatformUser can have multiple devices registered.
/// Device tokens (FCM tokens) are stored here and used by the
/// notification queue processor to send push notifications.
/// </summary>
public class DeviceRegistration : BaseEntity
{
    /// <summary>
    /// The platform user who owns this device.
    /// </summary>
    public Guid PlatformUserId { get; private set; }

    /// <summary>
    /// Firebase Cloud Messaging (FCM) device token.
    /// This token is used to send push notifications to the device.
    /// </summary>
    public string DeviceToken { get; private set; } = string.Empty;

    /// <summary>
    /// Unique identifier for the device (e.g., device UUID from mobile app).
    /// Used to identify the same device across token refreshes.
    /// </summary>
    public string DeviceId { get; private set; } = string.Empty;

    /// <summary>
    /// User-friendly name for the device (e.g., "John's iPhone").
    /// </summary>
    public string? DeviceName { get; private set; }

    /// <summary>
    /// Platform type (iOS or Android).
    /// </summary>
    public DevicePlatform Platform { get; private set; }

    /// <summary>
    /// Version of the mobile app installed on the device.
    /// </summary>
    public string? AppVersion { get; private set; }

    /// <summary>
    /// Operating system version of the device.
    /// </summary>
    public string? OsVersion { get; private set; }

    /// <summary>
    /// Timestamp when the device was last active (last API call or token refresh).
    /// </summary>
    public DateTime? LastActiveAt { get; private set; }

    /// <summary>
    /// Timestamp when the device token was last refreshed.
    /// </summary>
    public DateTime? TokenRefreshedAt { get; private set; }

    // Navigation property
    public PlatformUser? PlatformUser { get; private set; }

    // Private constructor for EF
    private DeviceRegistration() { }

    /// <summary>
    /// Creates a new device registration.
    /// </summary>
    public static DeviceRegistration Create(
        Guid platformUserId,
        string deviceToken,
        string deviceId,
        DevicePlatform platform,
        string? deviceName = null,
        string? appVersion = null,
        string? osVersion = null,
        Guid? createdBy = null)
    {
        var device = new DeviceRegistration
        {
            PlatformUserId = platformUserId,
            DeviceToken = deviceToken,
            DeviceId = deviceId,
            Platform = platform,
            DeviceName = deviceName?.Trim(),
            AppVersion = appVersion?.Trim(),
            OsVersion = osVersion?.Trim(),
            LastActiveAt = DateTime.UtcNow,
            TokenRefreshedAt = DateTime.UtcNow
        };

        device.SetCreatedBy(createdBy);
        return device;
    }

    /// <summary>
    /// Updates the FCM token (called when token is refreshed by Firebase SDK).
    /// </summary>
    public void UpdateToken(string newToken, Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(newToken))
        {
            throw new ArgumentException("Device token cannot be empty.", nameof(newToken));
        }

        DeviceToken = newToken;
        TokenRefreshedAt = DateTime.UtcNow;
        LastActiveAt = DateTime.UtcNow;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates device information (app version, OS version, device name).
    /// </summary>
    public void UpdateDeviceInfo(
        string? deviceName = null,
        string? appVersion = null,
        string? osVersion = null,
        Guid? updatedBy = null)
    {
        DeviceName = deviceName?.Trim() ?? DeviceName;
        AppVersion = appVersion?.Trim() ?? AppVersion;
        OsVersion = osVersion?.Trim() ?? OsVersion;
        LastActiveAt = DateTime.UtcNow;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Records that the device was active (e.g., made an API call).
    /// </summary>
    public void RecordActivity()
    {
        LastActiveAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Deactivates the device registration (e.g., user logged out).
    /// </summary>
    public void Unregister(Guid? updatedBy = null)
    {
        Deactivate(updatedBy);
    }
}
