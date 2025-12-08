using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyProfilePhoto;

/// <summary>
/// Command to update the current user's profile photo using file stream.
/// </summary>
public record UpdateMyProfilePhotoCommand : IRequest<Result<ProfilePhotoResultDto>>
{
    /// <summary>
    /// The file stream containing the image data.
    /// </summary>
    public required Stream FileStream { get; init; }

    /// <summary>
    /// Original file name.
    /// </summary>
    public required string FileName { get; init; }

    /// <summary>
    /// Content type/MIME type of the file.
    /// </summary>
    public required string ContentType { get; init; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long FileSize { get; init; }
}

/// <summary>
/// Result DTO containing the uploaded profile photo information.
/// </summary>
public record ProfilePhotoResultDto
{
    /// <summary>
    /// The document ID of the uploaded profile photo.
    /// </summary>
    public Guid DocumentId { get; init; }

    /// <summary>
    /// The download URL for the profile photo (SAS URL with expiration).
    /// </summary>
    public string DownloadUrl { get; init; } = string.Empty;

    /// <summary>
    /// The file name of the uploaded photo.
    /// </summary>
    public string FileName { get; init; } = string.Empty;

    /// <summary>
    /// The content type of the uploaded photo.
    /// </summary>
    public string ContentType { get; init; } = string.Empty;

    /// <summary>
    /// The size of the uploaded photo in bytes.
    /// </summary>
    public long SizeBytes { get; init; }
}
