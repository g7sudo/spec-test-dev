using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.ResidentInvites.Dtos;

/// <summary>
/// DTO for resident invite record.
/// </summary>
public record ResidentInviteDto
{
    /// <summary>
    /// Unique identifier of the invite.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The lease this invite is for.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// The party being invited.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Party display name.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Role being offered.
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Role as text.
    /// </summary>
    public string RoleText => Role.ToString();

    /// <summary>
    /// Current status of the invitation.
    /// </summary>
    public ResidentInviteStatus Status { get; init; }

    /// <summary>
    /// Status as text.
    /// </summary>
    public string StatusText => Status.ToString();

    /// <summary>
    /// Email address the invite was sent to.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// When the invite expires.
    /// </summary>
    public DateTime ExpiresAt { get; init; }

    /// <summary>
    /// When the invite was accepted.
    /// </summary>
    public DateTime? AcceptedAt { get; init; }

    /// <summary>
    /// When the invite was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; init; }

    /// <summary>
    /// Whether the invite is still valid.
    /// </summary>
    public bool IsValid => Status == ResidentInviteStatus.Pending && DateTime.UtcNow <= ExpiresAt;

    /// <summary>
    /// When the invite was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}
