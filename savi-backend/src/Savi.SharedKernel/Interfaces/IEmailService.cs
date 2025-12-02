namespace Savi.SharedKernel.Interfaces;

/// <summary>
/// Abstraction for sending emails.
/// Implementation can be swapped (Maileroo, SendGrid, SMTP, etc.) without changing callers.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an email asynchronously.
    /// </summary>
    /// <param name="message">The email message to send.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure with error details.</returns>
    Task<EmailResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an email using a predefined template.
    /// </summary>
    /// <param name="templateName">The template name (e.g., "TenantAdminInvitation").</param>
    /// <param name="to">Recipient email address.</param>
    /// <param name="toName">Recipient display name (optional).</param>
    /// <param name="templateData">Key-value pairs for template placeholders.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success or failure with error details.</returns>
    Task<EmailResult> SendTemplateAsync(
        string templateName,
        string to,
        string? toName,
        Dictionary<string, string> templateData,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Represents an email message to be sent.
/// </summary>
public sealed record EmailMessage
{
    /// <summary>
    /// Recipient email address.
    /// </summary>
    public string To { get; init; } = string.Empty;

    /// <summary>
    /// Recipient display name (optional).
    /// </summary>
    public string? ToName { get; init; }

    /// <summary>
    /// Email subject line.
    /// </summary>
    public string Subject { get; init; } = string.Empty;

    /// <summary>
    /// Plain text body (fallback for non-HTML clients).
    /// </summary>
    public string? TextBody { get; init; }

    /// <summary>
    /// HTML body content.
    /// </summary>
    public string? HtmlBody { get; init; }

    /// <summary>
    /// Reply-to email address (optional).
    /// </summary>
    public string? ReplyTo { get; init; }

    /// <summary>
    /// Custom headers (optional).
    /// </summary>
    public Dictionary<string, string>? Headers { get; init; }
}

/// <summary>
/// Result of an email send operation.
/// </summary>
public sealed record EmailResult
{
    /// <summary>
    /// Whether the email was sent successfully.
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Error message if the send failed.
    /// </summary>
    public string? Error { get; init; }

    /// <summary>
    /// Provider-specific message ID (for tracking).
    /// </summary>
    public string? MessageId { get; init; }

    /// <summary>
    /// Creates a successful result.
    /// </summary>
    public static EmailResult Ok(string? messageId = null) => new()
    {
        Success = true,
        MessageId = messageId
    };

    /// <summary>
    /// Creates a failure result.
    /// </summary>
    public static EmailResult Fail(string error) => new()
    {
        Success = false,
        Error = error
    };
}
