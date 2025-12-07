using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.DeleteAnnouncementComment;

/// <summary>
/// Command to delete a comment (soft delete).
/// Users can delete their own comments, admins can delete any comment.
/// </summary>
public record DeleteAnnouncementCommentCommand(Guid CommentId) : IRequest<Result>;
