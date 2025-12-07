using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.DeleteComment;

/// <summary>
/// Command to delete a comment.
/// </summary>
public record DeleteCommentCommand(Guid CommentId) : IRequest<Result>;
