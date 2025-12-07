using Savi.Domain.Platform.Enums;

namespace Savi.Application.Platform.Devices.Dtos;

/// <summary>
/// DTO for device registration information.
/// </summary>
public sealed record DeviceDto(
    Guid Id,
    string DeviceId,
    string? DeviceName,
    DevicePlatform Platform,
    string? AppVersion,
    string? OsVersion,
    bool IsActive,
    DateTime? LastActiveAt,
    DateTime CreatedAt
);
