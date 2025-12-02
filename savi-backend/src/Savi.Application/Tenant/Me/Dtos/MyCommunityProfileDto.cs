using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Me.Dtos;

/// <summary>
/// DTO for the current user's community profile.
/// Includes display settings, privacy preferences, and notification settings.
/// </summary>
public record MyCommunityProfileDto
{
    /// <summary>
    /// Profile ID.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The community user ID this profile belongs to.
    /// </summary>
    public Guid CommunityUserId { get; init; }

    #region Display / Profile

    /// <summary>
    /// Preferred display name.
    /// </summary>
    public string? DisplayName { get; init; }

    /// <summary>
    /// About me / bio text.
    /// </summary>
    public string? AboutMe { get; init; }

    /// <summary>
    /// Profile photo document ID.
    /// </summary>
    public Guid? ProfilePhotoDocumentId { get; init; }

    /// <summary>
    /// URL to the profile photo (resolved from document).
    /// </summary>
    public string? ProfilePhotoUrl { get; init; }

    #endregion

    #region Party Information (from linked Party)

    /// <summary>
    /// Party name (display name from Party entity).
    /// </summary>
    public string? PartyName { get; init; }

    /// <summary>
    /// First name (for individuals).
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Last name (for individuals).
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Primary email from Party contacts.
    /// </summary>
    public string? PrimaryEmail { get; init; }

    /// <summary>
    /// Primary phone from Party contacts.
    /// </summary>
    public string? PrimaryPhone { get; init; }

    #endregion

    #region Directory & Privacy

    /// <summary>
    /// Visibility scope in the resident directory.
    /// </summary>
    public DirectoryVisibilityScope DirectoryVisibility { get; init; }

    /// <summary>
    /// Whether shown in directory.
    /// </summary>
    public bool ShowInDirectory { get; init; }

    /// <summary>
    /// Whether name is shown in directory.
    /// </summary>
    public bool ShowNameInDirectory { get; init; }

    /// <summary>
    /// Whether unit is shown in directory.
    /// </summary>
    public bool ShowUnitInDirectory { get; init; }

    /// <summary>
    /// Whether phone is shown in directory.
    /// </summary>
    public bool ShowPhoneInDirectory { get; init; }

    /// <summary>
    /// Whether email is shown in directory.
    /// </summary>
    public bool ShowEmailInDirectory { get; init; }

    /// <summary>
    /// Whether profile photo is shown in directory.
    /// </summary>
    public bool ShowProfilePhotoInDirectory { get; init; }

    #endregion

    #region Notification Preferences

    /// <summary>
    /// Whether push notifications are enabled.
    /// </summary>
    public bool PushEnabled { get; init; }

    /// <summary>
    /// Whether email notifications are enabled.
    /// </summary>
    public bool EmailEnabled { get; init; }

    /// <summary>
    /// Notify on maintenance updates.
    /// </summary>
    public bool NotifyMaintenanceUpdates { get; init; }

    /// <summary>
    /// Notify on amenity bookings.
    /// </summary>
    public bool NotifyAmenityBookings { get; init; }

    /// <summary>
    /// Notify when visitor at gate.
    /// </summary>
    public bool NotifyVisitorAtGate { get; init; }

    /// <summary>
    /// Notify on announcements.
    /// </summary>
    public bool NotifyAnnouncements { get; init; }

    /// <summary>
    /// Notify on marketplace activity.
    /// </summary>
    public bool NotifyMarketplace { get; init; }

    #endregion

    /// <summary>
    /// When the profile was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the profile was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; init; }
}
