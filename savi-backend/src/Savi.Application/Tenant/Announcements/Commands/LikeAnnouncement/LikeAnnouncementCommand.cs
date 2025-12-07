using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.LikeAnnouncement;

/// <summary>
/// Command to like or unlike an announcement.
/// </summary>
public record LikeAnnouncementCommand(
    Guid AnnouncementId,
    bool Like // true = like, false = unlike
) : IRequest<Result<int>>; // Returns updated like count
