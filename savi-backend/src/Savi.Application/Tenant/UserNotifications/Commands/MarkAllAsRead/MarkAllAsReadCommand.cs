using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.UserNotifications.Commands.MarkAllAsRead;

/// <summary>
/// Command to mark all notifications as read for the current user.
/// </summary>
public record MarkAllAsReadCommand : IRequest<Result<int>>;
