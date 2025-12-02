using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;
using Savi.Application.Tenant.Files.Dtos;

namespace Savi.Application.Tenant.Community.Commands.UpdateBlock;
/// <summary>
/// Command to update an existing block.
/// </summary>
public record UpdateBlockCommand(
    Guid Id,
    string Name,
    string? Description,
    int DisplayOrder,
    /// <summary>
    /// List of existing documents to manage (update or delete).
    /// Documents with ActionState.Deleted will be soft-deleted.
    /// Others will have their metadata updated.
    /// </summary>
    List<DocumentManagementDto>? Documents = null,
    /// <summary>
    /// List of tempKeys for new documents to add.
    /// All TempFileUploads with these keys will be moved to permanent storage.
    /// </summary>
    List<string>? TempDocuments = null
) : IRequest<Result>;
