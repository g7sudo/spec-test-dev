using MediatR;
using Microsoft.AspNetCore.Http;
using Savi.Application.Tenant.Files.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Commands.UploadTempFile;

/// <summary>
/// Command to upload a file to temporary storage.
/// Used during entity creation when entity ID doesn't exist yet.
/// </summary>
public record UploadTempFileCommand : IRequest<Result<TempFileUploadDto>>
{
    public string TempKey { get; init; } = string.Empty;
    public IFormFile File { get; init; } = null!;
}
