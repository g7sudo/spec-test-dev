using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Platform-level record of resident invite access codes.
/// Enables lookup of access codes without knowing the tenant.
/// </summary>
public class ResidentInviteCode : BaseEntity
{
    /// <summary>
    /// The 6-character access code (unique across platform).
    /// </summary>
    public string AccessCode { get; private set; } = string.Empty;

    /// <summary>
    /// The tenant this invite belongs to.
    /// </summary>
    public Guid TenantId { get; private set; }

    /// <summary>
    /// The tenant code/slug for API routing.
    /// </summary>
    public string TenantCode { get; private set; } = string.Empty;

    /// <summary>
    /// The tenant/community display name.
    /// </summary>
    public string TenantName { get; private set; } = string.Empty;

    /// <summary>
    /// The invite ID in the tenant database.
    /// </summary>
    public Guid InviteId { get; private set; }

    /// <summary>
    /// The invitation token for accepting the invite.
    /// </summary>
    public string InvitationToken { get; private set; } = string.Empty;

    /// <summary>
    /// Email address the invite was sent to.
    /// </summary>
    public string Email { get; private set; } = string.Empty;

    /// <summary>
    /// Name of the invited party.
    /// </summary>
    public string? PartyName { get; private set; }

    /// <summary>
    /// Unit label (e.g., "A-301").
    /// </summary>
    public string? UnitLabel { get; private set; }

    /// <summary>
    /// Role being offered (PrimaryResident, CoResident).
    /// </summary>
    public string Role { get; private set; } = string.Empty;

    /// <summary>
    /// When the invite expires.
    /// </summary>
    public DateTime ExpiresAt { get; private set; }

    /// <summary>
    /// Current status of the code.
    /// </summary>
    public InviteCodeStatus Status { get; private set; } = InviteCodeStatus.Active;

    /// <summary>
    /// When the code was used/accepted.
    /// </summary>
    public DateTime? UsedAt { get; private set; }

    // Private constructor for EF
    private ResidentInviteCode() { }

    /// <summary>
    /// Creates a new resident invite code record.
    /// </summary>
    public static ResidentInviteCode Create(
        string accessCode,
        Guid tenantId,
        string tenantCode,
        string tenantName,
        Guid inviteId,
        string invitationToken,
        string email,
        string? partyName,
        string? unitLabel,
        string role,
        DateTime expiresAt)
    {
        var record = new ResidentInviteCode
        {
            AccessCode = accessCode.ToUpperInvariant().Trim(),
            TenantId = tenantId,
            TenantCode = tenantCode,
            TenantName = tenantName,
            InviteId = inviteId,
            InvitationToken = invitationToken,
            Email = email.ToLowerInvariant().Trim(),
            PartyName = partyName,
            UnitLabel = unitLabel,
            Role = role,
            ExpiresAt = expiresAt,
            Status = InviteCodeStatus.Active
        };

        return record;
    }

    /// <summary>
    /// Marks the code as used/accepted.
    /// </summary>
    public void MarkAsUsed()
    {
        Status = InviteCodeStatus.Used;
        UsedAt = DateTime.UtcNow;
        MarkAsUpdated(null);
    }

    /// <summary>
    /// Marks the code as cancelled.
    /// </summary>
    public void Cancel()
    {
        Status = InviteCodeStatus.Cancelled;
        MarkAsUpdated(null);
    }

    /// <summary>
    /// Marks the code as expired.
    /// </summary>
    public void MarkAsExpired()
    {
        Status = InviteCodeStatus.Expired;
        MarkAsUpdated(null);
    }

    /// <summary>
    /// Checks if the code is still valid.
    /// </summary>
    public bool IsValid => Status == InviteCodeStatus.Active && DateTime.UtcNow <= ExpiresAt;
}

/// <summary>
/// Status of an invite code.
/// </summary>
public enum InviteCodeStatus
{
    /// <summary>Code is active and can be used.</summary>
    Active,

    /// <summary>Code has been used/accepted.</summary>
    Used,

    /// <summary>Code was cancelled.</summary>
    Cancelled,

    /// <summary>Code has expired.</summary>
    Expired
}
