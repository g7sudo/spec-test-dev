using MediatR;
using Savi.Application.Platform.Notifications.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Notifications.Commands.QueueNotification;

/// <summary>
/// Command to queue a notification for a user.
/// Called by tenant services to queue notifications.
/// </summary>
public sealed record QueueNotificationCommand : IRequest<Result<QueueNotificationResponse>>
{
    /// <summary>
    /// The tenant ID that is queueing this notification.
    /// </summary>
    public Guid SourceTenantId { get; init; }

    /// <summary>
    /// The notification request details.
    /// </summary>
    public QueueNotificationRequest Request { get; init; } = new();
}
