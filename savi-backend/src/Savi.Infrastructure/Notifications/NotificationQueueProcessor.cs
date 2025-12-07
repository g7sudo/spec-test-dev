using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Savi.Domain.Platform.Enums;
using Savi.Infrastructure.Persistence.Platform;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Notifications;

/// <summary>
/// Configuration options for the notification queue processor.
/// </summary>
public class NotificationQueueProcessorOptions
{
    public const string SectionName = "NotificationQueue";

    /// <summary>
    /// Interval between processing cycles in seconds.
    /// Default: 5 seconds.
    /// </summary>
    public int ProcessingIntervalSeconds { get; set; } = 5;

    /// <summary>
    /// Maximum number of notifications to process per cycle.
    /// Default: 100.
    /// </summary>
    public int BatchSize { get; set; } = 100;

    /// <summary>
    /// Whether the processor is enabled.
    /// Default: true.
    /// </summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Background service that processes the notification queue and sends push notifications.
/// </summary>
public class NotificationQueueProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IPushNotificationService _pushNotificationService;
    private readonly ILogger<NotificationQueueProcessor> _logger;
    private readonly NotificationQueueProcessorOptions _options;

    public NotificationQueueProcessor(
        IServiceProvider serviceProvider,
        IPushNotificationService pushNotificationService,
        IOptions<NotificationQueueProcessorOptions> options,
        ILogger<NotificationQueueProcessor> logger)
    {
        _serviceProvider = serviceProvider;
        _pushNotificationService = pushNotificationService;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Notification queue processor is disabled");
            return;
        }

        _logger.LogInformation(
            "Notification queue processor started. Interval: {Interval}s, BatchSize: {BatchSize}",
            _options.ProcessingIntervalSeconds,
            _options.BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessQueueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing notification queue");
            }

            await Task.Delay(
                TimeSpan.FromSeconds(_options.ProcessingIntervalSeconds),
                stoppingToken);
        }
    }

    private async Task ProcessQueueAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();

        // Mark expired notifications
        await MarkExpiredNotificationsAsync(dbContext, cancellationToken);

        // Get pending notifications
        var pendingNotifications = await dbContext.NotificationQueueSet
            .Where(n => n.Status == NotificationStatus.Pending)
            .Where(n => !n.NextRetryAt.HasValue || n.NextRetryAt <= DateTime.UtcNow)
            .OrderByDescending(n => n.Priority)
            .ThenBy(n => n.CreatedAt)
            .Take(_options.BatchSize)
            .ToListAsync(cancellationToken);

        if (pendingNotifications.Count == 0)
        {
            return;
        }

        _logger.LogInformation(
            "Processing {Count} pending notifications",
            pendingNotifications.Count);

        foreach (var notification in pendingNotifications)
        {
            await ProcessNotificationAsync(dbContext, notification, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkExpiredNotificationsAsync(
        PlatformDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var expiredNotifications = await dbContext.NotificationQueueSet
            .Where(n => n.Status == NotificationStatus.Pending)
            .Where(n => n.ExpiresAt.HasValue && n.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var notification in expiredNotifications)
        {
            notification.MarkAsExpired();
            _logger.LogInformation(
                "Notification {NotificationId} marked as expired",
                notification.Id);
        }

        if (expiredNotifications.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task ProcessNotificationAsync(
        PlatformDbContext dbContext,
        Domain.Platform.NotificationQueue notification,
        CancellationToken cancellationToken)
    {
        // Check if expired
        if (notification.IsExpired)
        {
            notification.MarkAsExpired();
            return;
        }

        // Mark as processing
        notification.MarkAsProcessing();
        await dbContext.SaveChangesAsync(cancellationToken);

        // Get all active device tokens for the user
        var deviceTokens = await dbContext.DeviceRegistrationsSet
            .Where(d => d.PlatformUserId == notification.PlatformUserId && d.IsActive)
            .Select(d => d.DeviceToken)
            .ToListAsync(cancellationToken);

        if (deviceTokens.Count == 0)
        {
            _logger.LogWarning(
                "No devices found for user {UserId}, notification {NotificationId}",
                notification.PlatformUserId,
                notification.Id);

            // Mark as failed - no devices
            notification.MarkAsFailed("No registered devices for user");
            return;
        }

        // Parse data payload if present
        Dictionary<string, string>? data = null;
        if (!string.IsNullOrEmpty(notification.Data))
        {
            try
            {
                data = JsonSerializer.Deserialize<Dictionary<string, string>>(notification.Data);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex,
                    "Failed to parse data payload for notification {NotificationId}",
                    notification.Id);
            }
        }

        // Add notification metadata to data
        data ??= new Dictionary<string, string>();
        data["notificationId"] = notification.Id.ToString();
        data["sourceType"] = notification.SourceType.ToString();
        if (notification.SourceTenantId.HasValue)
        {
            data["sourceTenantId"] = notification.SourceTenantId.Value.ToString();
        }

        // Send to all devices
        if (deviceTokens.Count == 1)
        {
            var result = await _pushNotificationService.SendToDeviceAsync(
                deviceTokens[0],
                notification.Title,
                notification.Body,
                data,
                cancellationToken);

            if (result.Success)
            {
                notification.MarkAsSent();
                _logger.LogInformation(
                    "Notification {NotificationId} sent successfully. MessageId: {MessageId}",
                    notification.Id,
                    result.MessageId);
            }
            else
            {
                HandleSendFailure(notification, result.ErrorCode, result.ErrorMessage);
            }
        }
        else
        {
            var result = await _pushNotificationService.SendToDevicesAsync(
                deviceTokens,
                notification.Title,
                notification.Body,
                data,
                cancellationToken);

            if (result.SuccessCount > 0)
            {
                notification.MarkAsSent();
                _logger.LogInformation(
                    "Notification {NotificationId} sent to {SuccessCount}/{TotalCount} devices",
                    notification.Id,
                    result.SuccessCount,
                    deviceTokens.Count);
            }
            else
            {
                var errorMessage = result.Failures?.FirstOrDefault()?.ErrorMessage ?? "All devices failed";
                HandleSendFailure(notification, "BATCH_FAILED", errorMessage);
            }

            // Handle invalid device tokens
            if (result.Failures != null)
            {
                foreach (var failure in result.Failures)
                {
                    if (IsInvalidTokenError(failure.ErrorCode))
                    {
                        await DeactivateInvalidDeviceAsync(dbContext, failure.DeviceToken, cancellationToken);
                    }
                }
            }
        }
    }

    private void HandleSendFailure(
        Domain.Platform.NotificationQueue notification,
        string? errorCode,
        string? errorMessage)
    {
        notification.MarkAsFailed(errorMessage ?? "Unknown error");

        _logger.LogWarning(
            "Failed to send notification {NotificationId}. ErrorCode: {ErrorCode}, Error: {Error}, RetryCount: {RetryCount}",
            notification.Id,
            errorCode,
            errorMessage,
            notification.RetryCount);
    }

    private static bool IsInvalidTokenError(string errorCode)
    {
        // Firebase error codes that indicate invalid/expired tokens
        return errorCode is "UNREGISTERED" or "INVALID_ARGUMENT" or "NOT_FOUND";
    }

    private async Task DeactivateInvalidDeviceAsync(
        PlatformDbContext dbContext,
        string deviceToken,
        CancellationToken cancellationToken)
    {
        var device = await dbContext.DeviceRegistrationsSet
            .FirstOrDefaultAsync(d => d.DeviceToken == deviceToken && d.IsActive, cancellationToken);

        if (device != null)
        {
            device.Unregister();
            _logger.LogInformation(
                "Deactivated device with invalid token. DeviceId: {DeviceId}",
                device.DeviceId);
        }
    }
}
