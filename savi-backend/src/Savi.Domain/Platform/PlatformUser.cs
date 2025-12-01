using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Global user record linked to Firebase identity.
/// 
/// PlatformUser is the single identity that spans all tenants.
/// A user may belong to multiple tenants via UserTenantMembership.
/// </summary>
public class PlatformUser : BaseEntity
{
    /// <summary>
    /// Firebase UID from authentication.
    /// Nullable until first login (for pre-invited users).
    /// </summary>
    public string? FirebaseUid { get; private set; }

    /// <summary>
    /// User's email address. Unique across the platform.
    /// </summary>
    public string Email { get; private set; } = string.Empty;

    /// <summary>
    /// User's full name.
    /// </summary>
    public string? FullName { get; private set; }

    /// <summary>
    /// User's phone number.
    /// </summary>
    public string? PhoneNumber { get; private set; }

    // Navigation properties
    private readonly List<PlatformUserRole> _platformUserRoles = new();
    public IReadOnlyCollection<PlatformUserRole> PlatformUserRoles => _platformUserRoles.AsReadOnly();

    private readonly List<UserTenantMembership> _tenantMemberships = new();
    public IReadOnlyCollection<UserTenantMembership> TenantMemberships => _tenantMemberships.AsReadOnly();

    // Private constructor for EF
    private PlatformUser() { }

    /// <summary>
    /// Creates a new platform user.
    /// </summary>
    public static PlatformUser Create(
        string email,
        string? fullName = null,
        string? phoneNumber = null,
        string? firebaseUid = null,
        Guid? createdBy = null)
    {
        var user = new PlatformUser
        {
            Email = email.ToLowerInvariant().Trim(),
            FullName = fullName?.Trim(),
            PhoneNumber = phoneNumber?.Trim(),
            FirebaseUid = firebaseUid
        };

        user.SetCreatedBy(createdBy);
        return user;
    }

    /// <summary>
    /// Links this user to a Firebase account after first login.
    /// </summary>
    public void LinkFirebaseAccount(string firebaseUid, Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(firebaseUid))
        {
            throw new ArgumentException("Firebase UID cannot be empty.", nameof(firebaseUid));
        }

        FirebaseUid = firebaseUid;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the user's profile information.
    /// </summary>
    public void UpdateProfile(string? fullName, string? phoneNumber, Guid? updatedBy = null)
    {
        FullName = fullName?.Trim();
        PhoneNumber = phoneNumber?.Trim();
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the user's email address.
    /// </summary>
    public void UpdateEmail(string email, Guid? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email cannot be empty.", nameof(email));
        }

        Email = email.ToLowerInvariant().Trim();
        MarkAsUpdated(updatedBy);
    }
}

