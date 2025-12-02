namespace Savi.Application.Tenant.Community.Dtos;

public record UnitTypeDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int DefaultParkingSlots { get; init; }
    public int? DefaultOccupancyLimit { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
