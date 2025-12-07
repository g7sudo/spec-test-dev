using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.ArchiveAnnouncement;

/// <summary>
/// Command to archive an announcement.
/// </summary>
public record ArchiveAnnouncementCommand(Guid Id) : IRequest<Result>;
