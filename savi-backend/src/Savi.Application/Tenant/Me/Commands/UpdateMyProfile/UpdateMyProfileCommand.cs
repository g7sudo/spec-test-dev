using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyProfile;

/// <summary>
/// Command to update the current user's display profile settings.
/// </summary>
public record UpdateMyProfileCommand : IRequest<Result<MediatR.Unit>>
{
    /// <summary>
    /// Preferred display name.
    /// </summary>
    public string? DisplayName { get; init; }

    /// <summary>
    /// About me / bio text.
    /// </summary>
    public string? AboutMe { get; init; }

    /// <summary>
    /// Profile photo document ID (for existing documents).
    /// </summary>
    public Guid? ProfilePhotoDocumentId { get; init; }

    /// <summary>
    /// Temporary key for uploaded profile photo.
    /// If provided, the temp file will be moved to permanent storage.
    /// </summary>
    public string? TempProfilePhoto { get; init; }
}

