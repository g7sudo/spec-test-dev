using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.HideAnnouncementComment;

/// <summary>
/// Command to hide or unhide a comment (moderation action).
/// </summary>
public record HideAnnouncementCommentCommand(
    Guid CommentId,
    bool Hide // true = hide, false = unhide
) : IRequest<Result>;
