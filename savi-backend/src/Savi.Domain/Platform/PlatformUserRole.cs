using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Join entity linking PlatformUser to PlatformRole.
/// Assigns platform roles to global users.
/// </summary>
public class PlatformUserRole : BaseEntity
{
    /// <summary>
    /// The user being assigned the role.
    /// </summary>
    public Guid PlatformUserId { get; private set; }
    public PlatformUser? PlatformUser { get; private set; }

    /// <summary>
    /// The role being assigned.
    /// </summary>
    public Guid PlatformRoleId { get; private set; }
    public PlatformRole? PlatformRole { get; private set; }

    // Private constructor for EF
    private PlatformUserRole() { }

    /// <summary>
    /// Creates a new platform user role assignment.
    /// </summary>
    public static PlatformUserRole Create(
        Guid platformUserId,
        Guid platformRoleId,
        Guid? createdBy = null)
    {
        var userRole = new PlatformUserRole
        {
            PlatformUserId = platformUserId,
            PlatformRoleId = platformRoleId
        };

        userRole.SetCreatedBy(createdBy);
        return userRole;
    }
}

