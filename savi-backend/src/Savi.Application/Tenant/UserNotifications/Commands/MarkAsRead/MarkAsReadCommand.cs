using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.UserNotifications.Commands.MarkAsRead;

/// <summary>
/// Command to mark a notification as read.
/// </summary>
public record MarkAsReadCommand(Guid NotificationId) : IRequest<Result>;
