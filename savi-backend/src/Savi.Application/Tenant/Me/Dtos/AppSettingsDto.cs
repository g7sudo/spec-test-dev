using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Me.Dtos;

/// <summary>
/// DTO for app settings (theme, biometric, locale).
/// </summary>
public record AppSettingsDto
{
    /// <summary>
    /// Theme mode preference (System, Light, Dark).
    /// </summary>
    public ThemeMode Theme { get; init; }

    /// <summary>
    /// Whether biometric authentication is enabled.
    /// </summary>
    public bool BiometricEnabled { get; init; }

    /// <summary>
    /// Preferred locale (e.g., "en-US", "es-ES").
    /// </summary>
    public string? Locale { get; init; }
}
