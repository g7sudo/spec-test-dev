using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.PinAnnouncement;

/// <summary>
/// Command to pin or unpin an announcement.
/// </summary>
public record PinAnnouncementCommand(
    Guid Id,
    bool IsPinned
) : IRequest<Result>;
