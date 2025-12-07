namespace Savi.Application.Platform.Devices.Dtos;

/// <summary>
/// Response DTO for device registration.
/// </summary>
public sealed record RegisterDeviceResponse(
    Guid DeviceRegistrationId,
    string DeviceId,
    bool IsNewRegistration
);
