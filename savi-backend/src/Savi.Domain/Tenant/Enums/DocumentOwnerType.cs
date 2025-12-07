namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Defines the types of entities that can own documents/files.
/// Used to associate uploaded files with their parent entity.
/// </summary>
public enum DocumentOwnerType
{
    /// <summary>
    /// Document belongs to a Unit (apartment/flat).
    /// </summary>
    Unit = 1,

    /// <summary>
    /// Document belongs to a Block (building/tower).
    /// </summary>
    Block = 2,

    /// <summary>
    /// Document belongs to a Floor within a block.
    /// </summary>
    Floor = 3,

    /// <summary>
    /// Document belongs to a Parking Slot.
    /// </summary>
    ParkingSlot = 4,

    /// <summary>
    /// Document belongs to a Maintenance Request.
    /// </summary>
    MaintenanceRequest = 5,

    /// <summary>
    /// Document belongs to a Community User (profile image, ID proof, etc.).
    /// </summary>
    CommunityUser = 6,

    /// <summary>
    /// Document belongs to an Amenity (photos, rules documents, etc.).
    /// </summary>
    Amenity = 7,

    /// <summary>
    /// Document belongs to an Announcement (images, posters, etc.).
    /// </summary>
    Announcement = 8
}
