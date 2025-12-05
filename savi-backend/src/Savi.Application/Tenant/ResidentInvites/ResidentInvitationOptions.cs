namespace Savi.Application.Tenant.ResidentInvites;

/// <summary>
/// Options that control resident invitation behaviour.
/// </summary>
public sealed class ResidentInvitationOptions
{
    /// <summary>
    /// Configuration section name inside appsettings.
    /// </summary>
    public const string SectionName = "ResidentInvitations";

    /// <summary>
    /// Default number of days before an invitation expires.
    /// </summary>
    public int DefaultExpiryDays { get; set; } = 7;

    /// <summary>
    /// Base URL template for invitation accept links.
    /// Supports placeholders: {tenantSlug}, {inviteId}, {token}
    /// Example: "saviapp://accept-resident-invite?tenant={tenantSlug}&inviteId={inviteId}&token={token}"
    /// </summary>
    public string InvitationBaseUrl { get; set; } = "saviapp://accept-resident-invite?tenant={tenantSlug}&inviteId={inviteId}&token={token}";

    /// <summary>
    /// When true we log the invitation URL/token to server logs (useful for dev).
    /// </summary>
    public bool LogInvitationLink { get; set; } = true;

    /// <summary>
    /// When true we include invitation token/url in API responses (only for dev/local).
    /// </summary>
    public bool ExposeInvitationDetails { get; set; }
}
