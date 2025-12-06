namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of an amenity booking.
/// Maps to DBML: Enum AmenityBookingStatus
/// </summary>
public enum AmenityBookingStatus
{
    PendingApproval,
    Approved,
    Rejected,
    CancelledByResident,
    CancelledByAdmin,
    Completed,
    NoShow
}
