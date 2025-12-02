using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Profile and preference layer for a community user.
/// Contains display settings, directory/privacy options, and notification preferences.
/// Maps to DBML: Table CommunityUserProfile
/// </summary>
public class CommunityUserProfile : BaseEntity
{
    /// <summary>
    /// The community user this profile belongs to.
    /// </summary>
    public Guid CommunityUserId { get; private set; }

    #region Display / Profile

    /// <summary>
    /// Preferred display name; falls back to Party name if null.
    /// </summary>
    public string? DisplayName { get; private set; }

    /// <summary>
    /// About me / bio text.
    /// </summary>
    public string? AboutMe { get; private set; }

    /// <summary>
    /// Reference to profile photo document.
    /// Document with OwnerType = CommunityUser, Category = ProfileImage.
    /// </summary>
    public Guid? ProfilePhotoDocumentId { get; private set; }

    #endregion

    #region Directory & Privacy

    /// <summary>
    /// Visibility scope in the resident directory.
    /// </summary>
    public DirectoryVisibilityScope DirectoryVisibility { get; private set; } = DirectoryVisibilityScope.Community;

    /// <summary>
    /// Whether to show in directory at all.
    /// </summary>
    public bool ShowInDirectory { get; private set; } = true;

    /// <summary>
    /// Whether to show name in directory.
    /// </summary>
    public bool ShowNameInDirectory { get; private set; } = true;

    /// <summary>
    /// Whether to show unit information in directory.
    /// </summary>
    public bool ShowUnitInDirectory { get; private set; } = true;

    /// <summary>
    /// Whether to show phone number in directory.
    /// </summary>
    public bool ShowPhoneInDirectory { get; private set; } = false;

    /// <summary>
    /// Whether to show email in directory.
    /// </summary>
    public bool ShowEmailInDirectory { get; private set; } = false;

    /// <summary>
    /// Whether to show profile photo in directory.
    /// </summary>
    public bool ShowProfilePhotoInDirectory { get; private set; } = true;

    #endregion

    #region Notification Preferences

    /// <summary>
    /// Whether push notifications are enabled.
    /// </summary>
    public bool PushEnabled { get; private set; } = true;

    /// <summary>
    /// Whether email notifications are enabled.
    /// </summary>
    public bool EmailEnabled { get; private set; } = false;

    /// <summary>
    /// Receive notifications for maintenance request updates.
    /// </summary>
    public bool NotifyMaintenanceUpdates { get; private set; } = true;

    /// <summary>
    /// Receive notifications for amenity booking updates.
    /// </summary>
    public bool NotifyAmenityBookings { get; private set; } = true;

    /// <summary>
    /// Receive notifications when visitor arrives at gate.
    /// </summary>
    public bool NotifyVisitorAtGate { get; private set; } = true;

    /// <summary>
    /// Receive notifications for community announcements.
    /// </summary>
    public bool NotifyAnnouncements { get; private set; } = true;

    /// <summary>
    /// Receive notifications for marketplace activity.
    /// </summary>
    public bool NotifyMarketplace { get; private set; } = true;

    #endregion

    // EF Core constructor
    private CommunityUserProfile() { }

    /// <summary>
    /// Creates a new community user profile with default settings.
    /// </summary>
    public static CommunityUserProfile Create(
        Guid communityUserId,
        string? displayName = null,
        Guid? createdBy = null)
    {
        var profile = new CommunityUserProfile
        {
            CommunityUserId = communityUserId,
            DisplayName = displayName?.Trim()
        };

        profile.SetCreatedBy(createdBy);
        return profile;
    }

    /// <summary>
    /// Updates display/profile settings.
    /// </summary>
    public void UpdateDisplaySettings(
        string? displayName,
        string? aboutMe,
        Guid? profilePhotoDocumentId,
        Guid? updatedBy)
    {
        DisplayName = displayName?.Trim();
        AboutMe = aboutMe?.Trim();
        ProfilePhotoDocumentId = profilePhotoDocumentId;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates privacy/directory settings.
    /// </summary>
    public void UpdatePrivacySettings(
        DirectoryVisibilityScope directoryVisibility,
        bool showInDirectory,
        bool showNameInDirectory,
        bool showUnitInDirectory,
        bool showPhoneInDirectory,
        bool showEmailInDirectory,
        bool showProfilePhotoInDirectory,
        Guid? updatedBy)
    {
        DirectoryVisibility = directoryVisibility;
        ShowInDirectory = showInDirectory;
        ShowNameInDirectory = showNameInDirectory;
        ShowUnitInDirectory = showUnitInDirectory;
        ShowPhoneInDirectory = showPhoneInDirectory;
        ShowEmailInDirectory = showEmailInDirectory;
        ShowProfilePhotoInDirectory = showProfilePhotoInDirectory;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates notification preferences.
    /// </summary>
    public void UpdateNotificationSettings(
        bool pushEnabled,
        bool emailEnabled,
        bool notifyMaintenanceUpdates,
        bool notifyAmenityBookings,
        bool notifyVisitorAtGate,
        bool notifyAnnouncements,
        bool notifyMarketplace,
        Guid? updatedBy)
    {
        PushEnabled = pushEnabled;
        EmailEnabled = emailEnabled;
        NotifyMaintenanceUpdates = notifyMaintenanceUpdates;
        NotifyAmenityBookings = notifyAmenityBookings;
        NotifyVisitorAtGate = notifyVisitorAtGate;
        NotifyAnnouncements = notifyAnnouncements;
        NotifyMarketplace = notifyMarketplace;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets the profile photo document reference.
    /// </summary>
    public void SetProfilePhoto(Guid? documentId, Guid? updatedBy)
    {
        ProfilePhotoDocumentId = documentId;
        MarkAsUpdated(updatedBy);
    }
}

