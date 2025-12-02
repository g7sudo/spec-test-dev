using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a flat type configuration (e.g., Studio, 1BHK, 2BHK, Penthouse).
/// Used for units and default parking allocation rules.
/// </summary>
public class UnitType : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int DefaultParkingSlots { get; private set; }
    public int? DefaultOccupancyLimit { get; private set; }

    // EF Core constructor
    private UnitType() { }

    public static UnitType Create(
        string code,
        string name,
        string? description,
        int defaultParkingSlots,
        int? defaultOccupancyLimit,
        Guid? createdBy)
    {
        var unitType = new UnitType
        {
            Code = code,
            Name = name,
            Description = description,
            DefaultParkingSlots = defaultParkingSlots,
            DefaultOccupancyLimit = defaultOccupancyLimit
        };
        
        unitType.SetCreatedBy(createdBy);
        return unitType;
    }

    public void Update(
        string code,
        string name,
        string? description,
        int defaultParkingSlots,
        int? defaultOccupancyLimit,
        Guid? updatedBy)
    {
        Code = code;
        Name = name;
        Description = description;
        DefaultParkingSlots = defaultParkingSlots;
        DefaultOccupancyLimit = defaultOccupancyLimit;
        MarkAsUpdated(updatedBy);
    }
}
