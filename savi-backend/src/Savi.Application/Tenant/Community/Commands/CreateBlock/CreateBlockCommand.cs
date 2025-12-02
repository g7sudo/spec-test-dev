using MediatR;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Commands.CreateBlock;
/// <summary>
/// Command to create a new block (building/tower) in the community.
/// </summary>
public record CreateBlockCommand(
    string Name,
    string? Description,
    int DisplayOrder,
    /// <summary>
    /// List of tempKeys for uploaded images.
    /// All TempFileUploads with these keys will be moved to permanent storage.
    /// </summary>
    List<string>? TempDocuments = null
) : IRequest<Result<Guid>>;
