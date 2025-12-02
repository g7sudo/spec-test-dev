using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;

/// <summary>
/// Command to update the current user's privacy/directory settings.
/// </summary>
public record UpdateMyPrivacySettingsCommand : IRequest<Result<MediatR.Unit>>
{
    /// <summary>
    /// Visibility scope in the resident directory.
    /// </summary>
    public DirectoryVisibilityScope DirectoryVisibility { get; init; } = DirectoryVisibilityScope.Community;

    /// <summary>
    /// Whether to show in directory at all.
    /// </summary>
    public bool ShowInDirectory { get; init; } = true;

    /// <summary>
    /// Whether to show name in directory.
    /// </summary>
    public bool ShowNameInDirectory { get; init; } = true;

    /// <summary>
    /// Whether to show unit in directory.
    /// </summary>
    public bool ShowUnitInDirectory { get; init; } = true;

    /// <summary>
    /// Whether to show phone in directory.
    /// </summary>
    public bool ShowPhoneInDirectory { get; init; } = false;

    /// <summary>
    /// Whether to show email in directory.
    /// </summary>
    public bool ShowEmailInDirectory { get; init; } = false;

    /// <summary>
    /// Whether to show profile photo in directory.
    /// </summary>
    public bool ShowProfilePhotoInDirectory { get; init; } = true;
}

