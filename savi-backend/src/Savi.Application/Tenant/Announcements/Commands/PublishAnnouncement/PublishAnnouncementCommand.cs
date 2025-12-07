using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.PublishAnnouncement;

/// <summary>
/// Command to publish an announcement immediately or schedule it.
/// </summary>
public record PublishAnnouncementCommand(
    Guid Id,
    bool PublishImmediately = true,
    DateTime? ScheduledAt = null,
    DateTime? ExpiresAt = null
) : IRequest<Result>;
