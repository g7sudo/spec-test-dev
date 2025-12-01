using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a login-capable user in this community.
/// Mapped to a Party (person/company) and linked to global PlatformUser.
/// 
/// This is the tenant-level user that has roles and permissions within a specific community.
/// </summary>
public class CommunityUser : BaseEntity
{
    /// <summary>
    /// Reference to the Party entity (person/company details).
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Logical FK to PlatformDB.PlatformUser.Id.
    /// Links this tenant user to the global platform identity.
    /// Null until the user has logged in.
    /// </summary>
    public Guid? PlatformUserId { get; private set; }

    /// <summary>
    /// Preferred display name for this user in the community.
    /// Falls back to Party name if null.
    /// </summary>
    public string? PreferredName { get; private set; }

    /// <summary>
    /// User's preferred timezone.
    /// </summary>
    public string? Timezone { get; private set; }

    /// <summary>
    /// User's preferred locale.
    /// </summary>
    public string? Locale { get; private set; }

    // Navigation properties
    private readonly List<CommunityUserRoleGroup> _roleGroups = new();
    public IReadOnlyCollection<CommunityUserRoleGroup> RoleGroups => _roleGroups.AsReadOnly();

    // Private constructor for EF
    private CommunityUser() { }

    /// <summary>
    /// Creates a new community user.
    /// </summary>
    public static CommunityUser Create(
        Guid partyId,
        Guid? platformUserId = null,
        string? preferredName = null,
        string? timezone = null,
        string? locale = null,
        Guid? createdBy = null)
    {
        var user = new CommunityUser
        {
            PartyId = partyId,
            PlatformUserId = platformUserId,
            PreferredName = preferredName?.Trim(),
            Timezone = timezone,
            Locale = locale
        };

        user.SetCreatedBy(createdBy);
        return user;
    }

    /// <summary>
    /// Links this community user to a platform user after login.
    /// </summary>
    public void LinkPlatformUser(Guid platformUserId, Guid? updatedBy = null)
    {
        PlatformUserId = platformUserId;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the user's preferences.
    /// </summary>
    public void UpdatePreferences(
        string? preferredName,
        string? timezone,
        string? locale,
        Guid? updatedBy = null)
    {
        PreferredName = preferredName?.Trim();
        Timezone = timezone;
        Locale = locale;
        MarkAsUpdated(updatedBy);
    }
}

