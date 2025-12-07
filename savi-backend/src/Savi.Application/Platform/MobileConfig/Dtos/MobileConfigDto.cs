namespace Savi.Application.Platform.MobileConfig.Dtos;

/// <summary>
/// DTO for mobile app configuration and version information.
/// </summary>
public sealed record MobileConfigDto(
    string CurrentVersion,
    string NewVersion,
    bool IsForceUpdate
);
