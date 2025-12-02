using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;
using Savi.Application.Tenant.Files.Dtos;

namespace Savi.Application.Tenant.Community.Commands.UpdateFloor;
/// <summary>
/// Command to update an existing floor.
/// </summary>
public record UpdateFloorCommand(
    Guid Id,
    string Name,
    int LevelNumber,
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
