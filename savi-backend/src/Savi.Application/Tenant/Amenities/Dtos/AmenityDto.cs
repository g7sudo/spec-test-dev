using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Amenities.Dtos;

/// <summary>
/// DTO for amenity configuration.
/// </summary>
public record AmenityDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public AmenityType Type { get; init; }
    public AmenityStatus Status { get; init; }
    public string? Description { get; init; }
    public string? LocationText { get; init; }
    public bool IsVisibleInApp { get; init; }
    public int DisplayOrder { get; init; }

    // Booking Rules
    public bool IsBookable { get; init; }
    public bool RequiresApproval { get; init; }
    public int SlotDurationMinutes { get; init; }
    public TimeOnly? OpenTime { get; init; }
    public TimeOnly? CloseTime { get; init; }
    public int CleanupBufferMinutes { get; init; }
    public int MaxDaysInAdvance { get; init; }
    public int? MaxActiveBookingsPerUnit { get; init; }
    public int? MaxGuests { get; init; }
    public bool DepositRequired { get; init; }
    public decimal? DepositAmount { get; init; }

    /// <summary>
    /// Whether the amenity is currently available for booking.
    /// </summary>
    public bool IsAvailableForBooking { get; init; }

    /// <summary>
    /// Images and documents associated with the amenity.
    /// </summary>
    public List<DocumentDto> Documents { get; init; } = new();

    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Summary DTO for amenity list views.
/// </summary>
public record AmenitySummaryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public AmenityType Type { get; init; }
    public AmenityStatus Status { get; init; }
    public string? LocationText { get; init; }
    public bool IsBookable { get; init; }
    public bool RequiresApproval { get; init; }
    public bool DepositRequired { get; init; }
    public decimal? DepositAmount { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsAvailableForBooking { get; init; }

    /// <summary>
    /// Primary image URL for the amenity (first document if available).
    /// </summary>
    public string? PrimaryImageUrl { get; init; }
}
