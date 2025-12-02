using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Files.Commands.DeleteFile;

/// <summary>
/// Command to delete a document/file.
/// Deletes both the blob from storage and the database record.
/// </summary>
public record DeleteFileCommand(Guid DocumentId) : IRequest<Result>;
