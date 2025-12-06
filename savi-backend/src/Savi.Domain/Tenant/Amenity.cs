using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a bookable amenity facility in the community.
/// Maps to DBML: Table Amenity
/// </summary>
public class Amenity : BaseEntity
{
    /// <summary>
    /// Display name of the amenity (e.g., Party Hall, Tennis Court 1).
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Short code for the amenity (e.g., PHALL1, TENNIS1).
    /// </summary>
    public string? Code { get; private set; }

    /// <summary>
    /// Type of amenity.
    /// </summary>
    public AmenityType Type { get; private set; }

    /// <summary>
    /// Current status of the amenity.
    /// </summary>
    public AmenityStatus Status { get; private set; }

    /// <summary>
    /// Description of the amenity.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Free text location description or instructions.
    /// </summary>
    public string? LocationText { get; private set; }

    /// <summary>
    /// Whether the amenity is visible in the mobile app.
    /// </summary>
    public bool IsVisibleInApp { get; private set; }

    /// <summary>
    /// Display order for sorting.
    /// </summary>
    public int DisplayOrder { get; private set; }

    // Booking Rules

    /// <summary>
    /// Whether the amenity can be booked.
    /// </summary>
    public bool IsBookable { get; private set; }

    /// <summary>
    /// Whether bookings require admin approval.
    /// </summary>
    public bool RequiresApproval { get; private set; }

    /// <summary>
    /// Base slot duration in minutes.
    /// </summary>
    public int SlotDurationMinutes { get; private set; }

    /// <summary>
    /// Daily opening time.
    /// </summary>
    public TimeOnly? OpenTime { get; private set; }

    /// <summary>
    /// Daily closing time.
    /// </summary>
    public TimeOnly? CloseTime { get; private set; }

    /// <summary>
    /// Gap in minutes after booking before next slot is available.
    /// </summary>
    public int CleanupBufferMinutes { get; private set; }

    /// <summary>
    /// Maximum days in advance residents can book.
    /// </summary>
    public int MaxDaysInAdvance { get; private set; }

    /// <summary>
    /// Optional limit of active bookings per unit.
    /// </summary>
    public int? MaxActiveBookingsPerUnit { get; private set; }

    /// <summary>
    /// Optional maximum guest capacity.
    /// </summary>
    public int? MaxGuests { get; private set; }

    /// <summary>
    /// Whether a deposit is required for booking.
    /// </summary>
    public bool DepositRequired { get; private set; }

    /// <summary>
    /// Deposit amount if required.
    /// </summary>
    public decimal? DepositAmount { get; private set; }

    // EF Core constructor
    private Amenity() { }

    /// <summary>
    /// Creates a new amenity.
    /// </summary>
    public static Amenity Create(
        string name,
        string? code,
        AmenityType type,
        string? description,
        string? locationText,
        bool isVisibleInApp,
        int displayOrder,
        bool isBookable,
        bool requiresApproval,
        int slotDurationMinutes,
        TimeOnly? openTime,
        TimeOnly? closeTime,
        int cleanupBufferMinutes,
        int maxDaysInAdvance,
        int? maxActiveBookingsPerUnit,
        int? maxGuests,
        bool depositRequired,
        decimal? depositAmount,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Amenity name is required.", nameof(name));

        if (slotDurationMinutes <= 0)
            throw new ArgumentException("Slot duration must be positive.", nameof(slotDurationMinutes));

        if (maxDaysInAdvance <= 0)
            throw new ArgumentException("Max days in advance must be positive.", nameof(maxDaysInAdvance));

        if (depositRequired && (!depositAmount.HasValue || depositAmount.Value <= 0))
            throw new ArgumentException("Deposit amount must be specified when deposit is required.", nameof(depositAmount));

        var amenity = new Amenity
        {
            Name = name,
            Code = code,
            Type = type,
            Status = AmenityStatus.Active,
            Description = description,
            LocationText = locationText,
            IsVisibleInApp = isVisibleInApp,
            DisplayOrder = displayOrder,
            IsBookable = isBookable,
            RequiresApproval = requiresApproval,
            SlotDurationMinutes = slotDurationMinutes,
            OpenTime = openTime,
            CloseTime = closeTime,
            CleanupBufferMinutes = cleanupBufferMinutes,
            MaxDaysInAdvance = maxDaysInAdvance,
            MaxActiveBookingsPerUnit = maxActiveBookingsPerUnit,
            MaxGuests = maxGuests,
            DepositRequired = depositRequired,
            DepositAmount = depositRequired ? depositAmount : null
        };

        amenity.SetCreatedBy(createdBy);
        return amenity;
    }

    /// <summary>
    /// Updates the amenity details.
    /// </summary>
    public void Update(
        string name,
        string? code,
        AmenityType type,
        string? description,
        string? locationText,
        bool isVisibleInApp,
        int displayOrder,
        bool isBookable,
        bool requiresApproval,
        int slotDurationMinutes,
        TimeOnly? openTime,
        TimeOnly? closeTime,
        int cleanupBufferMinutes,
        int maxDaysInAdvance,
        int? maxActiveBookingsPerUnit,
        int? maxGuests,
        bool depositRequired,
        decimal? depositAmount,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Amenity name is required.", nameof(name));

        if (slotDurationMinutes <= 0)
            throw new ArgumentException("Slot duration must be positive.", nameof(slotDurationMinutes));

        if (maxDaysInAdvance <= 0)
            throw new ArgumentException("Max days in advance must be positive.", nameof(maxDaysInAdvance));

        if (depositRequired && (!depositAmount.HasValue || depositAmount.Value <= 0))
            throw new ArgumentException("Deposit amount must be specified when deposit is required.", nameof(depositAmount));

        Name = name;
        Code = code;
        Type = type;
        Description = description;
        LocationText = locationText;
        IsVisibleInApp = isVisibleInApp;
        DisplayOrder = displayOrder;
        IsBookable = isBookable;
        RequiresApproval = requiresApproval;
        SlotDurationMinutes = slotDurationMinutes;
        OpenTime = openTime;
        CloseTime = closeTime;
        CleanupBufferMinutes = cleanupBufferMinutes;
        MaxDaysInAdvance = maxDaysInAdvance;
        MaxActiveBookingsPerUnit = maxActiveBookingsPerUnit;
        MaxGuests = maxGuests;
        DepositRequired = depositRequired;
        DepositAmount = depositRequired ? depositAmount : null;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the amenity status.
    /// </summary>
    public void UpdateStatus(AmenityStatus status, Guid updatedBy)
    {
        Status = status;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Marks the amenity as under maintenance.
    /// </summary>
    public void MarkUnderMaintenance(Guid updatedBy)
    {
        Status = AmenityStatus.UnderMaintenance;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Reactivates the amenity.
    /// </summary>
    public void Reactivate(Guid updatedBy)
    {
        Status = AmenityStatus.Active;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if the amenity is currently available for booking.
    /// </summary>
    public bool IsAvailableForBooking => IsActive && Status == AmenityStatus.Active && IsBookable;
}
