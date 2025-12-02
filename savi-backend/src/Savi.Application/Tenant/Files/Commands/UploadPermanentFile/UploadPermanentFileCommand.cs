using MediatR;
using Microsoft.AspNetCore.Http;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Commands.UploadPermanentFile;

/// <summary>
/// Command to upload a file directly to permanent storage.
/// Used when the entity already exists (e.g., adding images to existing unit).
/// </summary>
public record UploadPermanentFileCommand : IRequest<Result<DocumentDto>>
{
    public DocumentOwnerType OwnerType { get; init; }
    public Guid OwnerId { get; init; }
    public DocumentCategory Category { get; init; }
    public IFormFile File { get; init; } = null!;
    public string? Description { get; init; }
}
