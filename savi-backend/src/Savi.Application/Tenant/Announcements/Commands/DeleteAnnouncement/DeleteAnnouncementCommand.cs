using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Announcements.Commands.DeleteAnnouncement;

/// <summary>
/// Command to soft-delete an announcement.
/// </summary>
public record DeleteAnnouncementCommand(Guid Id) : IRequest<Result>;
