using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.AddComment;

/// <summary>
/// Command to add a comment to a maintenance request.
/// </summary>
public record AddCommentCommand(
    Guid MaintenanceRequestId,
    MaintenanceCommentType CommentType,
    string Message,
    bool IsVisibleToResident,
    bool IsVisibleToOwner
) : IRequest<Result<Guid>>;
