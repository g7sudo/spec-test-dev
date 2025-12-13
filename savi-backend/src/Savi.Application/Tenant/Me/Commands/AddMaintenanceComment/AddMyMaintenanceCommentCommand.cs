using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.AddMaintenanceComment;

/// <summary>
/// Command to add a comment to the current user's own maintenance request.
/// CommentType is auto-set to ResidentUpdate, and visibility flags are auto-configured.
/// </summary>
public record AddMyMaintenanceCommentCommand(
    Guid RequestId,
    string Message
) : IRequest<Result<Guid>>;
