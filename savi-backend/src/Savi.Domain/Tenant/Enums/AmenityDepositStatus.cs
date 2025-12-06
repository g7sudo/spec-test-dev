namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of the deposit for an amenity booking.
/// Maps to DBML: Enum AmenityDepositStatus
/// </summary>
public enum AmenityDepositStatus
{
    NotRequired,
    Pending,
    Paid,
    Refunded,
    Forfeited
}
