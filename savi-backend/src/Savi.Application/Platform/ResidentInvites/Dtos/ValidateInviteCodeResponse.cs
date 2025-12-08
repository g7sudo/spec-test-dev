namespace Savi.Application.Platform.ResidentInvites.Dtos;

/// <summary>
/// Response DTO for validating a resident invite code at the platform level.
/// </summary>
public record ValidateInviteCodeResponse
{
    /// <summary>
    /// Whether the code is valid.
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// Error message if not valid.
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// The tenant ID (community).
    /// </summary>
    public Guid? TenantId { get; init; }

    /// <summary>
    /// The tenant code (slug).
    /// </summary>
    public string? TenantCode { get; init; }

    /// <summary>
    /// The tenant/community name.
    /// </summary>
    public string? TenantName { get; init; }

    /// <summary>
    /// The invite ID in the tenant database.
    /// </summary>
    public Guid? InviteId { get; init; }

    /// <summary>
    /// Email the invite was sent to.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Name of the invited party.
    /// </summary>
    public string? PartyName { get; init; }

    /// <summary>
    /// Unit label (e.g., "A-301").
    /// </summary>
    public string? UnitLabel { get; init; }

    /// <summary>
    /// Role being offered (e.g., "PrimaryResident", "CoResident").
    /// </summary>
    public string? Role { get; init; }

    /// <summary>
    /// When the invite expires.
    /// </summary>
    public DateTime? ExpiresAt { get; init; }

    /// <summary>
    /// The invitation token needed to accept the invite.
    /// Used by mobile app after Firebase authentication.
    /// </summary>
    public string? InvitationToken { get; init; }
}
