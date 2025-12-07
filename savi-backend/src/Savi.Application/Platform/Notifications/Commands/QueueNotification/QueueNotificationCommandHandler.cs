using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Notifications.Dtos;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Notifications.Commands.QueueNotification;

/// <summary>
/// Handler for QueueNotificationCommand.
/// Queues a notification for processing by the background worker.
/// </summary>
public sealed class QueueNotificationCommandHandler
    : IRequestHandler<QueueNotificationCommand, Result<QueueNotificationResponse>>
{
    private const int DeduplicationWindowMinutes = 5;

    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<QueueNotificationCommandHandler> _logger;

    public QueueNotificationCommandHandler(
        IPlatformDbContext platformDbContext,
        ILogger<QueueNotificationCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public async Task<Result<QueueNotificationResponse>> Handle(
        QueueNotificationCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;

        _logger.LogInformation(
            "Queueing notification for user {UserId} from tenant {TenantId}",
            request.PlatformUserId,
            command.SourceTenantId);

        // Verify the user exists
        var userExists = await _platformDbContext.PlatformUsers
            .AnyAsync(u => u.Id == request.PlatformUserId && u.IsActive, cancellationToken);

        if (!userExists)
        {
            return Result.Failure<QueueNotificationResponse>("User not found.");
        }

        // Parse priority
        var priority = NotificationPriority.Normal;
        if (!string.IsNullOrEmpty(request.Priority))
        {
            Enum.TryParse<NotificationPriority>(request.Priority, ignoreCase: true, out priority);
        }

        // Check for deduplication if key is provided
        if (!string.IsNullOrEmpty(request.DeduplicationKey))
        {
            var deduplicationWindow = DateTime.UtcNow.AddMinutes(-DeduplicationWindowMinutes);
            var isDuplicate = await _platformDbContext.NotificationQueue
                .AnyAsync(n =>
                    n.DeduplicationKey == request.DeduplicationKey &&
                    n.CreatedAt > deduplicationWindow &&
                    n.Status != NotificationStatus.Deduplicated,
                    cancellationToken);

            if (isDuplicate)
            {
                _logger.LogInformation(
                    "Notification deduplicated for key {DeduplicationKey}",
                    request.DeduplicationKey);

                return Result.Success(new QueueNotificationResponse(
                    NotificationId: Guid.Empty,
                    Status: "Deduplicated"));
            }
        }

        // Create the notification queue entry
        var notification = NotificationQueue.Create(
            platformUserId: request.PlatformUserId,
            title: request.Title,
            body: request.Body,
            sourceType: NotificationSourceType.Tenant,
            sourceTenantId: command.SourceTenantId,
            data: request.Data,
            deduplicationKey: request.DeduplicationKey,
            priority: priority,
            expiresAt: request.ExpiresAt);

        _platformDbContext.Add(notification);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Queued notification {NotificationId} for user {UserId}",
            notification.Id,
            request.PlatformUserId);

        return Result.Success(new QueueNotificationResponse(
            NotificationId: notification.Id,
            Status: "Queued"));
    }
}
