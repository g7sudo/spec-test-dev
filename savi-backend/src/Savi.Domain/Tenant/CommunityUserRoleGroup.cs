using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Associates community users with one or more role groups inside this tenant.
/// 
/// A user may have multiple role groups (e.g., both RESIDENT and MAINTENANCE_STAFF).
/// </summary>
public class CommunityUserRoleGroup : BaseEntity
{
    /// <summary>
    /// The community user.
    /// </summary>
    public Guid CommunityUserId { get; private set; }
    public CommunityUser? CommunityUser { get; private set; }

    /// <summary>
    /// The role group assigned to the user.
    /// </summary>
    public Guid RoleGroupId { get; private set; }
    public RoleGroup? RoleGroup { get; private set; }

    /// <summary>
    /// Whether this is the user's primary role group.
    /// </summary>
    public bool IsPrimary { get; private set; }

    /// <summary>
    /// When this role assignment becomes valid.
    /// </summary>
    public DateTime? ValidFrom { get; private set; }

    /// <summary>
    /// When this role assignment expires.
    /// </summary>
    public DateTime? ValidTo { get; private set; }

    // Private constructor for EF
    private CommunityUserRoleGroup() { }

    /// <summary>
    /// Creates a new community user role group assignment.
    /// </summary>
    public static CommunityUserRoleGroup Create(
        Guid communityUserId,
        Guid roleGroupId,
        bool isPrimary = false,
        DateTime? validFrom = null,
        DateTime? validTo = null,
        Guid? createdBy = null)
    {
        var assignment = new CommunityUserRoleGroup
        {
            CommunityUserId = communityUserId,
            RoleGroupId = roleGroupId,
            IsPrimary = isPrimary,
            ValidFrom = validFrom,
            ValidTo = validTo
        };

        assignment.SetCreatedBy(createdBy);
        return assignment;
    }

    /// <summary>
    /// Sets this as the primary role group.
    /// </summary>
    public void SetPrimary(bool isPrimary, Guid? updatedBy = null)
    {
        IsPrimary = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the validity period.
    /// </summary>
    public void UpdateValidity(DateTime? validFrom, DateTime? validTo, Guid? updatedBy = null)
    {
        ValidFrom = validFrom;
        ValidTo = validTo;
        MarkAsUpdated(updatedBy);
    }
}

