using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Notifications.Dtos;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Notifications.Commands.BroadcastNotification;

/// <summary>
/// Handler for BroadcastNotificationCommand.
/// Creates notification queue entries for all active platform users.
/// </summary>
public sealed class BroadcastNotificationCommandHandler
    : IRequestHandler<BroadcastNotificationCommand, Result<BroadcastNotificationResponse>>
{
    private const int BatchSize = 100;

    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<BroadcastNotificationCommandHandler> _logger;

    public BroadcastNotificationCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<BroadcastNotificationCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<BroadcastNotificationResponse>> Handle(
        BroadcastNotificationCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;

        _logger.LogInformation(
            "Broadcasting notification to all users. Title: {Title}. Initiated by: {UserId}",
            request.Title,
            _currentUser.UserId);

        // Parse priority
        var priority = NotificationPriority.High; // Default high for broadcasts
        if (!string.IsNullOrEmpty(request.Priority))
        {
            Enum.TryParse<NotificationPriority>(request.Priority, ignoreCase: true, out priority);
        }

        // Get all active users with registered devices
        var usersWithDevices = await _platformDbContext.DeviceRegistrations
            .Where(d => d.IsActive)
            .Select(d => d.PlatformUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (usersWithDevices.Count == 0)
        {
            _logger.LogWarning("No users with registered devices found for broadcast");
            return Result.Success(new BroadcastNotificationResponse(
                QueuedCount: 0,
                Message: "No users with registered devices found."));
        }

        // Create deduplication key for broadcast
        var broadcastId = Guid.NewGuid();
        var deduplicationKeyPrefix = $"broadcast_{broadcastId}";

        var queuedCount = 0;

        // Process in batches
        foreach (var userBatch in usersWithDevices.Chunk(BatchSize))
        {
            foreach (var userId in userBatch)
            {
                var notification = NotificationQueue.Create(
                    platformUserId: userId,
                    title: request.Title,
                    body: request.Body,
                    sourceType: NotificationSourceType.Platform,
                    sourceTenantId: null,
                    data: request.Data,
                    deduplicationKey: $"{deduplicationKeyPrefix}_{userId}",
                    priority: priority,
                    expiresAt: null,
                    createdBy: _currentUser.UserId);

                _platformDbContext.Add(notification);
                queuedCount++;
            }

            await _platformDbContext.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation(
            "Broadcast queued {Count} notifications for broadcast {BroadcastId}",
            queuedCount,
            broadcastId);

        return Result.Success(new BroadcastNotificationResponse(
            QueuedCount: queuedCount,
            Message: $"Successfully queued {queuedCount} notifications."));
    }
}
