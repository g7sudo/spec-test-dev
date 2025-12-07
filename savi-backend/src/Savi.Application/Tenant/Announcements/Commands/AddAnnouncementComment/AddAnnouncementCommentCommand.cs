using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.AddAnnouncementComment;

/// <summary>
/// Command to add a comment to an announcement.
/// </summary>
public record AddAnnouncementCommentCommand(
    Guid AnnouncementId,
    string Content,
    Guid? ParentCommentId = null
) : IRequest<Result<Guid>>;
