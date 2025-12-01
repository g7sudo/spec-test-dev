using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Links a PlatformUser to a Tenant with membership state and invite metadata.
/// 
/// This determines which communities a user belongs to.
/// A user can belong to multiple tenants with different roles in each.
/// </summary>
public class UserTenantMembership : BaseEntity
{
    /// <summary>
    /// The platform user.
    /// </summary>
    public Guid PlatformUserId { get; private set; }
    public PlatformUser? PlatformUser { get; private set; }

    /// <summary>
    /// The tenant (community) the user belongs to.
    /// </summary>
    public Guid TenantId { get; private set; }
    public Tenant? Tenant { get; private set; }

    /// <summary>
    /// Current membership status.
    /// </summary>
    public MembershipStatus Status { get; private set; } = MembershipStatus.Invited;

    /// <summary>
    /// High-level tenant role tag (e.g., "COMMUNITY_ADMIN", "RESIDENT", "OWNER").
    /// This is a convenience field; actual permissions come from TenantDB RoleGroups.
    /// </summary>
    public string? TenantRoleCode { get; private set; }

    /// <summary>
    /// Invitation token for email/deep-link onboarding.
    /// Null after acceptance.
    /// </summary>
    public string? InvitationToken { get; private set; }

    /// <summary>
    /// When the invitation expires.
    /// </summary>
    public DateTime? InvitationExpiresAt { get; private set; }

    /// <summary>
    /// Who invited this user.
    /// </summary>
    public Guid? InvitedByUserId { get; private set; }
    public PlatformUser? InvitedByUser { get; private set; }

    /// <summary>
    /// When the user accepted and membership became Active.
    /// </summary>
    public DateTime? JoinedAt { get; private set; }

    // Private constructor for EF
    private UserTenantMembership() { }

    /// <summary>
    /// Creates a new membership (invited state).
    /// </summary>
    public static UserTenantMembership CreateInvited(
        Guid platformUserId,
        Guid tenantId,
        string invitationToken,
        string? tenantRoleCode = null,
        int expiryDays = 7,
        Guid? invitedByUserId = null,
        Guid? createdBy = null)
    {
        var membership = new UserTenantMembership
        {
            PlatformUserId = platformUserId,
            TenantId = tenantId,
            Status = MembershipStatus.Invited,
            TenantRoleCode = tenantRoleCode?.ToUpperInvariant(),
            InvitationToken = invitationToken,
            InvitationExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            InvitedByUserId = invitedByUserId
        };

        membership.SetCreatedBy(createdBy);
        return membership;
    }

    /// <summary>
    /// Creates a direct active membership (no invite flow).
    /// </summary>
    public static UserTenantMembership CreateActive(
        Guid platformUserId,
        Guid tenantId,
        string? tenantRoleCode = null,
        Guid? createdBy = null)
    {
        var membership = new UserTenantMembership
        {
            PlatformUserId = platformUserId,
            TenantId = tenantId,
            Status = MembershipStatus.Active,
            TenantRoleCode = tenantRoleCode?.ToUpperInvariant(),
            JoinedAt = DateTime.UtcNow
        };

        membership.SetCreatedBy(createdBy);
        return membership;
    }

    /// <summary>
    /// Reissues an invitation with a fresh token/expiry.
    /// </summary>
    public void ReissueInvitation(
        string invitationToken,
        int expiryDays,
        Guid? invitedByUserId = null,
        Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(invitationToken))
        {
            throw new ArgumentException("Invitation token cannot be empty.", nameof(invitationToken));
        }

        if (expiryDays <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(expiryDays), "Expiry must be greater than zero.");
        }

        InvitationToken = invitationToken;
        InvitationExpiresAt = DateTime.UtcNow.AddDays(expiryDays);
        InvitedByUserId = invitedByUserId;
        Status = MembershipStatus.Invited;
        JoinedAt = null; // reset joined timestamp until acceptance
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Accepts the invitation and activates membership.
    /// </summary>
    public void Accept(Guid? updatedBy = null)
    {
        if (Status != MembershipStatus.Invited)
        {
            throw new InvalidOperationException("Can only accept an invitation in Invited status.");
        }

        Status = MembershipStatus.Active;
        JoinedAt = DateTime.UtcNow;
        InvitationToken = null; // Clear the token after acceptance
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Suspends the membership.
    /// </summary>
    public void Suspend(Guid? updatedBy = null)
    {
        Status = MembershipStatus.Suspended;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Reactivates a suspended membership.
    /// </summary>
    public void Reactivate(Guid? updatedBy = null)
    {
        Status = MembershipStatus.Active;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if the invitation has expired.
    /// </summary>
    public bool IsInvitationExpired()
    {
        return Status == MembershipStatus.Invited &&
               InvitationExpiresAt.HasValue &&
               DateTime.UtcNow > InvitationExpiresAt.Value;
    }

    /// <summary>
    /// Updates the tenant role code.
    /// </summary>
    public void UpdateTenantRoleCode(string? roleCode, Guid? updatedBy = null)
    {
        TenantRoleCode = roleCode?.ToUpperInvariant();
        MarkAsUpdated(updatedBy);
    }
}

/// <summary>
/// Status of a user's membership in a tenant.
/// </summary>
public enum MembershipStatus
{
    /// <summary>User has been invited but hasn't accepted yet.</summary>
    Invited,

    /// <summary>User is an active member of the tenant.</summary>
    Active,

    /// <summary>Membership has been suspended.</summary>
    Suspended
}

