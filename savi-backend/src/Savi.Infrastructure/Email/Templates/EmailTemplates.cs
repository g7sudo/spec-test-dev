namespace Savi.Infrastructure.Email.Templates;

/// <summary>
/// Email template definitions with HTML content and placeholders.
/// </summary>
public static class EmailTemplates
{
    /// <summary>
    /// Template names as constants.
    /// </summary>
    public static class Names
    {
        public const string TenantAdminInvitation = "TenantAdminInvitation";
        public const string WelcomeEmail = "WelcomeEmail";
        public const string PasswordReset = "PasswordReset";
    }

    /// <summary>
    /// Gets an email template by name.
    /// </summary>
    public static EmailTemplate? GetTemplate(string templateName)
    {
        return templateName switch
        {
            Names.TenantAdminInvitation => TenantAdminInvitationTemplate,
            Names.WelcomeEmail => WelcomeEmailTemplate,
            Names.PasswordReset => PasswordResetTemplate,
            _ => null
        };
    }

    /// <summary>
    /// Tenant admin invitation template.
    /// Placeholders: {{RecipientName}}, {{TenantName}}, {{InvitationUrl}}, {{ExpiryDays}}, {{InviterName}}
    /// </summary>
    public static readonly EmailTemplate TenantAdminInvitationTemplate = new()
    {
        Name = Names.TenantAdminInvitation,
        Subject = "You've been invited to manage {{TenantName}} on SAVI",
        HtmlBody = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #2563eb;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">SAVI</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">You're Invited!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi {{RecipientName}},
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    You've been invited to join <strong>{{TenantName}}</strong> as a Community Administrator on SAVI - the smart community management platform.
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    As a Community Admin, you'll be able to manage residents, amenities, maintenance requests, and more.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: #2563eb;">
                            <a href="{{InvitationUrl}}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                                Accept Invitation
                            </a>
                        </td>
                    </tr>
                </table>
                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    This invitation will expire in <strong>{{ExpiryDays}} days</strong>.
                </p>
                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                    If you didn't expect this invitation, you can safely ignore this email.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                    This email was sent by SAVI Community Management Platform.<br>
                    If you have questions, please contact your community administrator.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
""",
        TextBody = """
You've been invited to manage {{TenantName}} on SAVI

Hi {{RecipientName}},

You've been invited to join {{TenantName}} as a Community Administrator on SAVI - the smart community management platform.

As a Community Admin, you'll be able to manage residents, amenities, maintenance requests, and more.

Accept your invitation by visiting:
{{InvitationUrl}}

This invitation will expire in {{ExpiryDays}} days.

If you didn't expect this invitation, you can safely ignore this email.

---
SAVI Community Management Platform
"""
    };

    /// <summary>
    /// Welcome email template.
    /// Placeholders: {{RecipientName}}, {{TenantName}}, {{LoginUrl}}
    /// </summary>
    public static readonly EmailTemplate WelcomeEmailTemplate = new()
    {
        Name = Names.WelcomeEmail,
        Subject = "Welcome to {{TenantName}} on SAVI",
        HtmlBody = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #2563eb;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">SAVI</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to {{TenantName}}!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Hi {{RecipientName}}, your account has been activated. You can now access your community portal.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: #2563eb;">
                            <a href="{{LoginUrl}}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">
                                Go to Portal
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""",
        TextBody = """
Welcome to {{TenantName}} on SAVI!

Hi {{RecipientName}},

Your account has been activated. You can now access your community portal at:
{{LoginUrl}}

---
SAVI Community Management Platform
"""
    };

    /// <summary>
    /// Password reset template.
    /// Placeholders: {{RecipientName}}, {{ResetUrl}}, {{ExpiryMinutes}}
    /// </summary>
    public static readonly EmailTemplate PasswordResetTemplate = new()
    {
        Name = Names.PasswordReset,
        Subject = "Reset your SAVI password",
        HtmlBody = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #2563eb;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">SAVI</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Password Reset Request</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Hi {{RecipientName}}, we received a request to reset your password.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: #2563eb;">
                            <a href="{{ResetUrl}}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">
                                Reset Password
                            </a>
                        </td>
                    </tr>
                </table>
                <p style="color: #9ca3af; font-size: 14px;">
                    This link expires in {{ExpiryMinutes}} minutes. If you didn't request this, ignore this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
""",
        TextBody = """
Password Reset Request

Hi {{RecipientName}},

We received a request to reset your password. Visit this link to reset it:
{{ResetUrl}}

This link expires in {{ExpiryMinutes}} minutes.

If you didn't request this, you can safely ignore this email.

---
SAVI Community Management Platform
"""
    };
}

/// <summary>
/// Represents an email template.
/// </summary>
public sealed class EmailTemplate
{
    public string Name { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string HtmlBody { get; init; } = string.Empty;
    public string TextBody { get; init; } = string.Empty;

    /// <summary>
    /// Applies template data to replace placeholders.
    /// </summary>
    public (string Subject, string HtmlBody, string TextBody) Apply(Dictionary<string, string> data)
    {
        var subject = Subject;
        var html = HtmlBody;
        var text = TextBody;

        foreach (var (key, value) in data)
        {
            var placeholder = $"{{{{{key}}}}}";
            subject = subject.Replace(placeholder, value, StringComparison.OrdinalIgnoreCase);
            html = html.Replace(placeholder, value, StringComparison.OrdinalIgnoreCase);
            text = text.Replace(placeholder, value, StringComparison.OrdinalIgnoreCase);
        }

        return (subject, html, text);
    }
}
