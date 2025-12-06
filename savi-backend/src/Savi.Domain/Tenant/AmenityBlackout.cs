using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a period when an amenity is unavailable for booking.
/// This is a new entity proposed for handling blackout dates.
/// </summary>
public class AmenityBlackout : BaseEntity
{
    /// <summary>
    /// The amenity this blackout applies to.
    /// </summary>
    public Guid AmenityId { get; private set; }

    /// <summary>
    /// Start date of the blackout period.
    /// </summary>
    public DateOnly StartDate { get; private set; }

    /// <summary>
    /// End date of the blackout period.
    /// </summary>
    public DateOnly EndDate { get; private set; }

    /// <summary>
    /// Reason for the blackout (e.g., Maintenance, Holiday, Private Event).
    /// </summary>
    public string? Reason { get; private set; }

    /// <summary>
    /// If true, existing bookings in this range should be cancelled.
    /// </summary>
    public bool AutoCancelBookings { get; private set; }

    // EF Core constructor
    private AmenityBlackout() { }

    /// <summary>
    /// Creates a new amenity blackout period.
    /// </summary>
    public static AmenityBlackout Create(
        Guid amenityId,
        DateOnly startDate,
        DateOnly endDate,
        string? reason,
        bool autoCancelBookings,
        Guid createdBy)
    {
        if (endDate < startDate)
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));

        var blackout = new AmenityBlackout
        {
            AmenityId = amenityId,
            StartDate = startDate,
            EndDate = endDate,
            Reason = reason,
            AutoCancelBookings = autoCancelBookings
        };

        blackout.SetCreatedBy(createdBy);
        return blackout;
    }

    /// <summary>
    /// Updates the blackout period.
    /// </summary>
    public void Update(
        DateOnly startDate,
        DateOnly endDate,
        string? reason,
        bool autoCancelBookings,
        Guid updatedBy)
    {
        if (endDate < startDate)
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));

        StartDate = startDate;
        EndDate = endDate;
        Reason = reason;
        AutoCancelBookings = autoCancelBookings;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if a given date falls within this blackout period.
    /// </summary>
    public bool ContainsDate(DateOnly date)
    {
        return date >= StartDate && date <= EndDate;
    }

    /// <summary>
    /// Checks if a given date range overlaps with this blackout period.
    /// </summary>
    public bool OverlapsWith(DateOnly rangeStart, DateOnly rangeEnd)
    {
        return StartDate <= rangeEnd && EndDate >= rangeStart;
    }

    /// <summary>
    /// Checks if a given datetime range overlaps with this blackout period.
    /// </summary>
    public bool OverlapsWith(DateTime rangeStart, DateTime rangeEnd)
    {
        var startDate = DateOnly.FromDateTime(rangeStart);
        var endDate = DateOnly.FromDateTime(rangeEnd);
        return OverlapsWith(startDate, endDate);
    }
}
