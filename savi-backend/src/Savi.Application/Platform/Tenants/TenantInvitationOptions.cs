namespace Savi.Application.Platform.Tenants;

/// <summary>
/// Options that control tenant admin invitation behaviour.
/// </summary>
public sealed class TenantInvitationOptions
{
    /// <summary>
    /// Configuration section name inside appsettings.
    /// </summary>
    public const string SectionName = "TenantInvitations";

    /// <summary>
    /// Number of days before an invitation expires.
    /// </summary>
    public int ExpiryDays { get; set; } = 7;

    /// <summary>
    /// Default tenant role code to stamp onto UserTenantMembership (e.g. COMMUNITY_ADMIN).
    /// </summary>
    public string DefaultRoleCode { get; set; } = "COMMUNITY_ADMIN";

    /// <summary>
    /// Base URL template for invitation accept links. Use {token} placeholder for substitution.
    /// </summary>
    public string InvitationBaseUrl { get; set; } = "https://app.savi.app/invitations/accept?token={token}";

    /// <summary>
    /// When true we log the invitation URL/token to server logs (useful for dev).
    /// </summary>
    public bool LogInvitationLink { get; set; } = true;

    /// <summary>
    /// When true we include invitation token/url in API responses (only for dev/local).
    /// </summary>
    public bool ExposeInvitationDetails { get; set; }
}

