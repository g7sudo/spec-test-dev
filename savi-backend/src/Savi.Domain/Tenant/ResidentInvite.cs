using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents an invitation for a party to join a unit as a resident.
/// Used for both primary resident and co-resident invitations.
/// Maps to DBML: Table ResidentInvite (RESIDENT_INVITE)
/// </summary>
public class ResidentInvite : BaseEntity
{
    /// <summary>
    /// The lease this invite is for.
    /// </summary>
    public Guid LeaseId { get; private set; }

    /// <summary>
    /// The party being invited.
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Role being offered (PrimaryResident or CoResident).
    /// </summary>
    public LeasePartyRole Role { get; private set; }

    /// <summary>
    /// Current status of the invitation.
    /// </summary>
    public ResidentInviteStatus Status { get; private set; }

    /// <summary>
    /// Secure token for validating the invite link.
    /// </summary>
    public string InvitationToken { get; private set; } = string.Empty;

    /// <summary>
    /// Email address the invite was sent to.
    /// </summary>
    public string Email { get; private set; } = string.Empty;

    /// <summary>
    /// When the invite expires.
    /// </summary>
    public DateTime ExpiresAt { get; private set; }

    /// <summary>
    /// When the invite was accepted.
    /// </summary>
    public DateTime? AcceptedAt { get; private set; }

    /// <summary>
    /// The community user who accepted the invite.
    /// </summary>
    public Guid? AcceptedByUserId { get; private set; }

    /// <summary>
    /// When the invite was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; private set; }

    /// <summary>
    /// The community user who cancelled the invite.
    /// </summary>
    public Guid? CancelledByUserId { get; private set; }

    // EF Core constructor
    private ResidentInvite() { }

    /// <summary>
    /// Creates a new resident invitation.
    /// </summary>
    public static ResidentInvite Create(
        Guid leaseId,
        Guid partyId,
        LeasePartyRole role,
        string email,
        int expirationDays,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required for invitation.", nameof(email));
        }

        if (role != LeasePartyRole.PrimaryResident && role != LeasePartyRole.CoResident)
        {
            throw new ArgumentException("Only PrimaryResident or CoResident roles can be invited.", nameof(role));
        }

        if (expirationDays <= 0)
        {
            throw new ArgumentException("Expiration days must be positive.", nameof(expirationDays));
        }

        var invite = new ResidentInvite
        {
            LeaseId = leaseId,
            PartyId = partyId,
            Role = role,
            Email = email.ToLowerInvariant().Trim(),
            Status = ResidentInviteStatus.Pending,
            InvitationToken = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays)
        };

        invite.SetCreatedBy(createdBy);
        return invite;
    }

    /// <summary>
    /// Marks the invite as accepted.
    /// </summary>
    public void Accept(Guid acceptedByUserId)
    {
        if (Status != ResidentInviteStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot accept invite with status {Status}.");
        }

        if (DateTime.UtcNow > ExpiresAt)
        {
            throw new InvalidOperationException("This invitation has expired.");
        }

        Status = ResidentInviteStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
        AcceptedByUserId = acceptedByUserId;
        MarkAsUpdated(acceptedByUserId);
    }

    /// <summary>
    /// Cancels the invite.
    /// </summary>
    public void Cancel(Guid cancelledByUserId)
    {
        if (Status != ResidentInviteStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot cancel invite with status {Status}.");
        }

        Status = ResidentInviteStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancelledByUserId = cancelledByUserId;
        MarkAsUpdated(cancelledByUserId);
    }

    /// <summary>
    /// Marks the invite as expired (typically called by a background job).
    /// </summary>
    public void MarkAsExpired()
    {
        if (Status != ResidentInviteStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot expire invite with status {Status}.");
        }

        Status = ResidentInviteStatus.Expired;
        MarkAsUpdated(null);
    }

    /// <summary>
    /// Checks if the invite is still valid for acceptance.
    /// </summary>
    public bool IsValid => Status == ResidentInviteStatus.Pending && DateTime.UtcNow <= ExpiresAt;

    /// <summary>
    /// Checks if the invite has expired.
    /// </summary>
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;

    /// <summary>
    /// Validates the provided token against this invite.
    /// </summary>
    public bool ValidateToken(string token)
    {
        return !string.IsNullOrEmpty(token) &&
               InvitationToken.Equals(token, StringComparison.Ordinal);
    }

    /// <summary>
    /// Generates a secure random token for the invitation.
    /// </summary>
    private static string GenerateSecureToken()
    {
        var tokenBytes = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        return Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}
