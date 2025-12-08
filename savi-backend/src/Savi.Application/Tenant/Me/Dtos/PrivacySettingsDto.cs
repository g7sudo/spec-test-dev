using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Me.Dtos;

/// <summary>
/// DTO for privacy/directory settings.
/// </summary>
public record PrivacySettingsDto
{
    /// <summary>
    /// Visibility scope in the resident directory.
    /// </summary>
    public DirectoryVisibilityScope DirectoryVisibility { get; init; }

    /// <summary>
    /// Whether to show in directory at all.
    /// </summary>
    public bool ShowInDirectory { get; init; }

    /// <summary>
    /// Whether to show name in directory.
    /// </summary>
    public bool ShowNameInDirectory { get; init; }

    /// <summary>
    /// Whether to show unit information in directory.
    /// </summary>
    public bool ShowUnitInDirectory { get; init; }

    /// <summary>
    /// Whether to show phone number in directory.
    /// </summary>
    public bool ShowPhoneInDirectory { get; init; }

    /// <summary>
    /// Whether to show email in directory.
    /// </summary>
    public bool ShowEmailInDirectory { get; init; }

    /// <summary>
    /// Whether to show profile photo in directory.
    /// </summary>
    public bool ShowProfilePhotoInDirectory { get; init; }
}
