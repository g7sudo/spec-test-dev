using MediatR;
using Savi.SharedKernel.Common;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Commands.CreateFloor;
/// <summary>
/// Command to create a new floor within a block.
/// </summary>
public record CreateFloorCommand(
    Guid BlockId,
    string Name,
    int LevelNumber,
    int DisplayOrder,
    /// <summary>
    /// List of tempKeys for uploaded images.
    /// All TempFileUploads with these keys will be moved to permanent storage.
    /// </summary>
    List<string>? TempDocuments = null
) : IRequest<Result<Guid>>;
