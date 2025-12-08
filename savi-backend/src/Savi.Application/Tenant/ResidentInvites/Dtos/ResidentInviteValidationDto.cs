using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.ResidentInvites.Dtos;

/// <summary>
/// DTO for validating a resident invite (public endpoint).
/// </summary>
public record ResidentInviteValidationDto
{
    /// <summary>
    /// Whether the invite is valid.
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// Error message if not valid.
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// Invite ID.
    /// </summary>
    public Guid? InviteId { get; init; }

    /// <summary>
    /// Community/tenant name.
    /// </summary>
    public string? CommunityName { get; init; }

    /// <summary>
    /// Unit label (e.g., "A-301").
    /// </summary>
    public string? UnitLabel { get; init; }

    /// <summary>
    /// Email the invite was sent to.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Name of the invited party.
    /// </summary>
    public string? PartyName { get; init; }

    /// <summary>
    /// Role being offered.
    /// </summary>
    public LeasePartyRole? Role { get; init; }

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
