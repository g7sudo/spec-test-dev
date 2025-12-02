using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a parking slot inventory, optionally allocated to a unit.
/// </summary>
public class ParkingSlot : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public ParkingLocationType LocationType { get; private set; }
    public string? LevelLabel { get; private set; }
    public bool IsCovered { get; private set; }
    public bool IsEVCompatible { get; private set; }
    public ParkingStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public Guid? AllocatedUnitId { get; private set; }

    // EF Core constructor
    private ParkingSlot() { }

    public static ParkingSlot Create(
        string code,
        ParkingLocationType locationType,
        string? levelLabel,
        bool isCovered,
        bool isEVCompatible,
        ParkingStatus status,
        string? notes,
        Guid? createdBy)
    {
        var parkingSlot = new ParkingSlot
        {
            Code = code,
            LocationType = locationType,
            LevelLabel = levelLabel,
            IsCovered = isCovered,
            IsEVCompatible = isEVCompatible,
            Status = status,
            Notes = notes
        };
        
        parkingSlot.SetCreatedBy(createdBy);
        return parkingSlot;
    }

    public void Update(
        string code,
        ParkingLocationType locationType,
        string? levelLabel,
        bool isCovered,
        bool isEVCompatible,
        string? notes,
        Guid? updatedBy)
    {
        Code = code;
        LocationType = locationType;
        LevelLabel = levelLabel;
        IsCovered = isCovered;
        IsEVCompatible = isEVCompatible;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    public void AllocateToUnit(Guid unitId, Guid? updatedBy)
    {
        AllocatedUnitId = unitId;
        Status = ParkingStatus.Allocated;
        MarkAsUpdated(updatedBy);
    }

    public void Deallocate(Guid? updatedBy)
    {
        AllocatedUnitId = null;
        Status = ParkingStatus.Available;
        MarkAsUpdated(updatedBy);
    }

    public void UpdateStatus(ParkingStatus status, Guid? updatedBy)
    {
        Status = status;
        MarkAsUpdated(updatedBy);
    }
}
