using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyAppSettings;

/// <summary>
/// Command to update the current user's app settings.
/// </summary>
public record UpdateMyAppSettingsCommand : IRequest<Result<MediatR.Unit>>
{
    /// <summary>
    /// Theme mode preference (System, Light, Dark).
    /// </summary>
    public ThemeMode Theme { get; init; } = ThemeMode.System;

    /// <summary>
    /// Whether biometric authentication is enabled.
    /// </summary>
    public bool BiometricEnabled { get; init; } = false;

    /// <summary>
    /// Preferred locale (e.g., "en-US", "es-ES").
    /// </summary>
    public string? Locale { get; init; }
}
