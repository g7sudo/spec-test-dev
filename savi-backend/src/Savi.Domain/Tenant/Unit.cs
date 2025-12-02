using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents an individual apartment/flat within a floor.
/// </summary>
public class Unit : BaseEntity
{
    public Guid BlockId { get; private set; }
    public Guid FloorId { get; private set; }
    public Guid UnitTypeId { get; private set; }
    public string UnitNumber { get; private set; } = string.Empty;
    public decimal? AreaSqft { get; private set; }
    public UnitStatus Status { get; private set; }
    public string? Notes { get; private set; }

    // EF Core constructor
    private Unit() { }

    public static Unit Create(
        Guid blockId,
        Guid floorId,
        Guid unitTypeId,
        string unitNumber,
        decimal? areaSqft,
        UnitStatus status,
        string? notes,
        Guid? createdBy)
    {
        var unit = new Unit
        {
            BlockId = blockId,
            FloorId = floorId,
            UnitTypeId = unitTypeId,
            UnitNumber = unitNumber,
            AreaSqft = areaSqft,
            Status = status,
            Notes = notes
        };
        
        unit.SetCreatedBy(createdBy);
        return unit;
    }

    public void Update(
        Guid unitTypeId,
        string unitNumber,
        decimal? areaSqft,
        UnitStatus status,
        string? notes,
        Guid? updatedBy)
    {
        UnitTypeId = unitTypeId;
        UnitNumber = unitNumber;
        AreaSqft = areaSqft;
        Status = status;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    public void UpdateStatus(UnitStatus status, Guid? updatedBy)
    {
        Status = status;
        MarkAsUpdated(updatedBy);
    }
}
