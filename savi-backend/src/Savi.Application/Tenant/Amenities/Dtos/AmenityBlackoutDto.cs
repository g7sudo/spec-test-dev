namespace Savi.Application.Tenant.Amenities.Dtos;

/// <summary>
/// DTO for amenity blackout period.
/// </summary>
public record AmenityBlackoutDto
{
    public Guid Id { get; init; }
    public Guid AmenityId { get; init; }
    public string AmenityName { get; init; } = string.Empty;
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public string? Reason { get; init; }
    public bool AutoCancelBookings { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
