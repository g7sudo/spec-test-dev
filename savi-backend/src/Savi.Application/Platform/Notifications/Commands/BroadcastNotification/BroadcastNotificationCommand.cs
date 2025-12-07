using MediatR;
using Savi.Application.Platform.Notifications.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Notifications.Commands.BroadcastNotification;

/// <summary>
/// Command to broadcast a notification to all platform users.
/// Platform admin only - requires PLATFORM_NOTIFICATION_BROADCAST permission.
/// </summary>
public sealed record BroadcastNotificationCommand : IRequest<Result<BroadcastNotificationResponse>>
{
    /// <summary>
    /// The broadcast request details.
    /// </summary>
    public BroadcastNotificationRequest Request { get; init; } = new();
}
