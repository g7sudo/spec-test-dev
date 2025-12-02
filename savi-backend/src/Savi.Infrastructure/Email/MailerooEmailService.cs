using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Savi.Infrastructure.Email.Templates;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Email;

/// <summary>
/// Email service implementation using Maileroo API.
/// https://maileroo.com/docs/email-api/send-basic-email
/// </summary>
public sealed class MailerooEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly EmailSettings _settings;
    private readonly ILogger<MailerooEmailService> _logger;

    public MailerooEmailService(
        HttpClient httpClient,
        IOptions<EmailSettings> settings,
        ILogger<MailerooEmailService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<EmailResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation(
                "Email sending is disabled. Would have sent email to {To} with subject: {Subject}",
                message.To,
                message.Subject);
            return EmailResult.Ok("disabled-mode");
        }

        try
        {
            // Build form data for Maileroo API
            using var formData = new MultipartFormDataContent();

            // From address (required)
            var from = string.IsNullOrWhiteSpace(_settings.FromName)
                ? _settings.FromEmail
                : $"{_settings.FromName} <{_settings.FromEmail}>";
            formData.Add(new StringContent(from), "from");

            // To address (required)
            var to = string.IsNullOrWhiteSpace(message.ToName)
                ? message.To
                : $"{message.ToName} <{message.To}>";
            formData.Add(new StringContent(to), "to");

            // Subject (required)
            formData.Add(new StringContent(message.Subject), "subject");

            // Plain text body
            if (!string.IsNullOrWhiteSpace(message.TextBody))
            {
                formData.Add(new StringContent(message.TextBody), "plain");
            }

            // HTML body
            if (!string.IsNullOrWhiteSpace(message.HtmlBody))
            {
                formData.Add(new StringContent(message.HtmlBody), "html");
            }

            // Reply-to (optional)
            if (!string.IsNullOrWhiteSpace(message.ReplyTo))
            {
                formData.Add(new StringContent(message.ReplyTo), "reply_to");
            }

            // Create request
            using var request = new HttpRequestMessage(HttpMethod.Post, _settings.Maileroo.ApiUrl);
            request.Headers.Add("X-API-Key", _settings.Maileroo.ApiKey);
            request.Content = formData;

            // Send request
            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                // Parse response to get message ID
                string? messageId = null;
                try
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    if (doc.RootElement.TryGetProperty("message_id", out var msgIdProp))
                    {
                        messageId = msgIdProp.GetString();
                    }
                }
                catch
                {
                    // Ignore parse errors for message ID
                }

                _logger.LogInformation(
                    "Email sent successfully to {To}. MessageId: {MessageId}",
                    message.To,
                    messageId ?? "unknown");

                return EmailResult.Ok(messageId);
            }

            _logger.LogError(
                "Failed to send email to {To}. Status: {StatusCode}, Response: {Response}",
                message.To,
                response.StatusCode,
                responseBody);

            // Try to parse error message
            var errorMessage = $"Failed to send email: {response.StatusCode}";
            try
            {
                using var doc = JsonDocument.Parse(responseBody);
                if (doc.RootElement.TryGetProperty("error", out var errorProp))
                {
                    errorMessage = errorProp.GetString() ?? errorMessage;
                }
                else if (doc.RootElement.TryGetProperty("message", out var msgProp))
                {
                    errorMessage = msgProp.GetString() ?? errorMessage;
                }
            }
            catch
            {
                // Use default error message
            }

            return EmailResult.Fail(errorMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while sending email to {To}", message.To);
            return EmailResult.Fail($"Email send failed: {ex.Message}");
        }
    }

    public async Task<EmailResult> SendTemplateAsync(
        string templateName,
        string to,
        string? toName,
        Dictionary<string, string> templateData,
        CancellationToken cancellationToken = default)
    {
        var template = EmailTemplates.GetTemplate(templateName);
        if (template == null)
        {
            _logger.LogWarning("Email template '{TemplateName}' not found", templateName);
            return EmailResult.Fail($"Template '{templateName}' not found");
        }

        var (subject, htmlBody, textBody) = template.Apply(templateData);

        var message = new EmailMessage
        {
            To = to,
            ToName = toName,
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody
        };

        return await SendAsync(message, cancellationToken);
    }
}
