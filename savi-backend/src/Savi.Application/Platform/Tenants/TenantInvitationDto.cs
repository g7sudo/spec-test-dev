namespace Savi.Application.Platform.Tenants;

/// <summary>
/// Input payload for inviting a tenant admin from the platform surface.
/// </summary>
public sealed record InviteTenantAdminRequest
{
    /// <summary>
    /// Email address of the invitee (must match Firebase login later).
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Optional display name captured up front for nicer onboarding.
    /// </summary>
    public string? FullName { get; init; }
}

/// <summary>
/// Response issued after a tenant admin invite is created.
/// </summary>
public sealed record InviteTenantAdminResponse
{
    public Guid MembershipId { get; init; }
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public string TenantCode { get; init; } = string.Empty;
    public string InviteeEmail { get; init; } = string.Empty;
    public string TenantRoleCode { get; init; } = string.Empty;
    public DateTime InvitationExpiresAt { get; init; }

    /// <summary>
    /// Raw token is only set in Development to avoid leaking secrets in prod.
    /// </summary>
    public string? InvitationToken { get; init; }

    /// <summary>
    /// Convenience link (also dev-only) that frontend can show/log.
    /// </summary>
    public string? InvitationUrl { get; init; }
}

/// <summary>
/// Public response for validating an invitation token.
/// </summary>
public sealed record ValidateInvitationResponse
{
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public string TenantCode { get; init; } = string.Empty;
    public string? TenantCity { get; init; }
    public string InviteeEmail { get; init; } = string.Empty;
    public string TenantRoleCode { get; init; } = string.Empty;
    public DateTime InvitationExpiresAt { get; init; }
}

/// <summary>
/// Public request for accepting an invitation (requires Firebase auth).
/// </summary>
public sealed record AcceptInvitationRequest
{
    public string InvitationToken { get; init; } = string.Empty;
}

/// <summary>
/// Response after accepting an invite.
/// </summary>
public sealed record AcceptInvitationResponse
{
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public string TenantCode { get; init; } = string.Empty;
    public string TenantRoleCode { get; init; } = string.Empty;
    public bool RequiresFirstTimeSetup { get; init; }
}

