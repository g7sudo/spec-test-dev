namespace Savi.Application.Tenant.Amenities.Dtos;

/// <summary>
/// DTO for amenity availability response.
/// </summary>
public record AmenityAvailabilityDto
{
    public Guid AmenityId { get; init; }
    public string AmenityName { get; init; } = string.Empty;
    public DateOnly Date { get; init; }

    /// <summary>
    /// Available time slots for the given date.
    /// </summary>
    public List<AvailableSlotDto> AvailableSlots { get; init; } = new();

    /// <summary>
    /// Indicates if this date falls within a blackout period.
    /// </summary>
    public bool IsBlackoutDate { get; init; }

    /// <summary>
    /// Reason for blackout if IsBlackoutDate is true.
    /// </summary>
    public string? BlackoutReason { get; init; }
}

/// <summary>
/// DTO for a single available time slot.
/// </summary>
public record AvailableSlotDto
{
    /// <summary>
    /// Start time of the slot.
    /// </summary>
    public TimeOnly StartTime { get; init; }

    /// <summary>
    /// End time of the slot.
    /// </summary>
    public TimeOnly EndTime { get; init; }

    /// <summary>
    /// Whether this slot is available for booking.
    /// </summary>
    public bool IsAvailable { get; init; }

    /// <summary>
    /// Reason if not available (e.g., "Already booked", "Cleanup buffer").
    /// </summary>
    public string? UnavailableReason { get; init; }
}
