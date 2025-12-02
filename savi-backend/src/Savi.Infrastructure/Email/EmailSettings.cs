namespace Savi.Infrastructure.Email;

/// <summary>
/// Configuration settings for email service.
/// </summary>
public sealed class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>
    /// Email provider: "Maileroo", "SendGrid", "Smtp", etc.
    /// </summary>
    public string Provider { get; set; } = "Maileroo";

    /// <summary>
    /// Sender email address (From).
    /// </summary>
    public string FromEmail { get; set; } = string.Empty;

    /// <summary>
    /// Sender display name.
    /// </summary>
    public string FromName { get; set; } = "SAVI";

    /// <summary>
    /// Whether email sending is enabled. Set to false to disable in dev.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Maileroo-specific settings.
    /// </summary>
    public MailerooSettings Maileroo { get; set; } = new();
}

/// <summary>
/// Maileroo-specific configuration.
/// </summary>
public sealed class MailerooSettings
{
    /// <summary>
    /// API endpoint for sending emails.
    /// </summary>
    public string ApiUrl { get; set; } = "https://smtp.maileroo.com/send";

    /// <summary>
    /// API key for authentication (Sending API Key from Maileroo dashboard).
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
}
