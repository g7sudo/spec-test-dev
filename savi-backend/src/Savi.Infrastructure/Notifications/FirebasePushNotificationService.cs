using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Notifications;

/// <summary>
/// Configuration options for Firebase Push Notifications.
/// </summary>
public class FirebasePushNotificationOptions
{
    public const string SectionName = "Firebase";

    /// <summary>
    /// Path to the Firebase service account credentials JSON file.
    /// If not provided, will try to use default application credentials.
    /// </summary>
    public string? CredentialsPath { get; set; }

    /// <summary>
    /// Firebase service account credentials JSON content.
    /// Alternative to CredentialsPath for environments where file access is limited.
    /// </summary>
    public string? CredentialsJson { get; set; }

    /// <summary>
    /// Firebase project ID. Required if not using credentials file.
    /// </summary>
    public string? ProjectId { get; set; }
}

/// <summary>
/// Firebase Cloud Messaging implementation of IPushNotificationService.
/// </summary>
public class FirebasePushNotificationService : IPushNotificationService
{
    private readonly ILogger<FirebasePushNotificationService> _logger;
    private readonly FirebaseMessaging _messaging;

    public FirebasePushNotificationService(
        IOptions<FirebasePushNotificationOptions> options,
        ILogger<FirebasePushNotificationService> logger)
    {
        _logger = logger;

        // Initialize Firebase if not already initialized
        if (FirebaseApp.DefaultInstance == null)
        {
            var optionsValue = options.Value;

            if (!string.IsNullOrEmpty(optionsValue.CredentialsJson))
            {
                var credential = GoogleCredential.FromJson(optionsValue.CredentialsJson);
                FirebaseApp.Create(new AppOptions
                {
                    Credential = credential,
                    ProjectId = optionsValue.ProjectId
                });
            }
            else if (!string.IsNullOrEmpty(optionsValue.CredentialsPath))
            {
                var credential = GoogleCredential.FromFile(optionsValue.CredentialsPath);
                FirebaseApp.Create(new AppOptions
                {
                    Credential = credential,
                    ProjectId = optionsValue.ProjectId
                });
            }
            else
            {
                // Use application default credentials
                FirebaseApp.Create();
            }
        }

        _messaging = FirebaseMessaging.DefaultInstance;
    }

    public async Task<PushNotificationResult> SendToDeviceAsync(
        string deviceToken,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var message = new Message
            {
                Token = deviceToken,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data
            };

            var messageId = await _messaging.SendAsync(message, cancellationToken);

            _logger.LogInformation(
                "Push notification sent successfully. MessageId: {MessageId}",
                messageId);

            return new PushNotificationResult(Success: true, MessageId: messageId);
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogError(ex,
                "Failed to send push notification. ErrorCode: {ErrorCode}",
                ex.MessagingErrorCode);

            return new PushNotificationResult(
                Success: false,
                ErrorCode: ex.MessagingErrorCode?.ToString(),
                ErrorMessage: ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending push notification");

            return new PushNotificationResult(
                Success: false,
                ErrorCode: "UNKNOWN",
                ErrorMessage: ex.Message);
        }
    }

    public async Task<PushNotificationBatchResult> SendToDevicesAsync(
        IEnumerable<string> deviceTokens,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default)
    {
        var tokensList = deviceTokens.ToList();
        if (tokensList.Count == 0)
        {
            return new PushNotificationBatchResult(SuccessCount: 0, FailureCount: 0);
        }

        try
        {
            var message = new MulticastMessage
            {
                Tokens = tokensList,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data
            };

            var response = await _messaging.SendEachForMulticastAsync(message, cancellationToken);

            var failures = new List<PushNotificationFailure>();
            for (int i = 0; i < response.Responses.Count; i++)
            {
                var individualResponse = response.Responses[i];
                if (!individualResponse.IsSuccess && individualResponse.Exception != null)
                {
                    failures.Add(new PushNotificationFailure(
                        DeviceToken: tokensList[i],
                        ErrorCode: individualResponse.Exception.MessagingErrorCode?.ToString() ?? "UNKNOWN",
                        ErrorMessage: individualResponse.Exception.Message));
                }
            }

            _logger.LogInformation(
                "Batch push notification sent. Success: {SuccessCount}, Failure: {FailureCount}",
                response.SuccessCount,
                response.FailureCount);

            return new PushNotificationBatchResult(
                SuccessCount: response.SuccessCount,
                FailureCount: response.FailureCount,
                Failures: failures.Count > 0 ? failures : null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send batch push notifications");

            // All failed
            var failures = tokensList.Select(t => new PushNotificationFailure(
                DeviceToken: t,
                ErrorCode: "BATCH_FAILED",
                ErrorMessage: ex.Message)).ToList();

            return new PushNotificationBatchResult(
                SuccessCount: 0,
                FailureCount: tokensList.Count,
                Failures: failures);
        }
    }

    public async Task<PushNotificationResult> SendToTopicAsync(
        string topic,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var message = new Message
            {
                Topic = topic,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data
            };

            var messageId = await _messaging.SendAsync(message, cancellationToken);

            _logger.LogInformation(
                "Topic notification sent successfully. Topic: {Topic}, MessageId: {MessageId}",
                topic,
                messageId);

            return new PushNotificationResult(Success: true, MessageId: messageId);
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogError(ex,
                "Failed to send topic notification. Topic: {Topic}, ErrorCode: {ErrorCode}",
                topic,
                ex.MessagingErrorCode);

            return new PushNotificationResult(
                Success: false,
                ErrorCode: ex.MessagingErrorCode?.ToString(),
                ErrorMessage: ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending topic notification to {Topic}", topic);

            return new PushNotificationResult(
                Success: false,
                ErrorCode: "UNKNOWN",
                ErrorMessage: ex.Message);
        }
    }

    public async Task<PushNotificationResult> SubscribeToTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _messaging.SubscribeToTopicAsync(
                new[] { deviceToken },
                topic);

            if (response.SuccessCount > 0)
            {
                _logger.LogInformation(
                    "Device subscribed to topic. Topic: {Topic}",
                    topic);

                return new PushNotificationResult(Success: true);
            }

            var error = response.Errors?.FirstOrDefault();
            return new PushNotificationResult(
                Success: false,
                ErrorCode: error?.Reason,
                ErrorMessage: $"Failed to subscribe to topic: {error?.Reason}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to subscribe device to topic {Topic}", topic);

            return new PushNotificationResult(
                Success: false,
                ErrorCode: "SUBSCRIBE_FAILED",
                ErrorMessage: ex.Message);
        }
    }

    public async Task<PushNotificationResult> UnsubscribeFromTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _messaging.UnsubscribeFromTopicAsync(
                new[] { deviceToken },
                topic);

            if (response.SuccessCount > 0)
            {
                _logger.LogInformation(
                    "Device unsubscribed from topic. Topic: {Topic}",
                    topic);

                return new PushNotificationResult(Success: true);
            }

            var error = response.Errors?.FirstOrDefault();
            return new PushNotificationResult(
                Success: false,
                ErrorCode: error?.Reason,
                ErrorMessage: $"Failed to unsubscribe from topic: {error?.Reason}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unsubscribe device from topic {Topic}", topic);

            return new PushNotificationResult(
                Success: false,
                ErrorCode: "UNSUBSCRIBE_FAILED",
                ErrorMessage: ex.Message);
        }
    }
}
