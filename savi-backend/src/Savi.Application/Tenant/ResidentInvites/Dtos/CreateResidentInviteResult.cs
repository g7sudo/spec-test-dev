using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.ResidentInvites.Dtos;

/// <summary>
/// Result returned after creating a resident invite.
/// </summary>
public record CreateResidentInviteResult
{
    /// <summary>
    /// The ID of the created invite.
    /// </summary>
    public Guid InviteId { get; init; }

    /// <summary>
    /// The lease ID this invite is for.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// The party ID being invited.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// The party name.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Email the invite was sent to.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Role being offered.
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// When the invite expires.
    /// </summary>
    public DateTime ExpiresAt { get; init; }

    /// <summary>
    /// Whether the email was sent successfully.
    /// </summary>
    public bool EmailSent { get; init; }

    /// <summary>
    /// The invitation token (only exposed in dev/local environments).
    /// </summary>
    public string? InvitationToken { get; init; }

    /// <summary>
    /// The invitation URL (only exposed in dev/local environments).
    /// </summary>
    public string? InvitationUrl { get; init; }
}
