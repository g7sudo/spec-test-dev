using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a floor within a block.
/// </summary>
public class Floor : BaseEntity
{
    public Guid BlockId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int LevelNumber { get; private set; }
    public int DisplayOrder { get; private set; }

    // EF Core constructor
    private Floor() { }

    public static Floor Create(Guid blockId, string name, int levelNumber, int displayOrder, Guid? createdBy)
    {
        var floor = new Floor
        {
            BlockId = blockId,
            Name = name,
            LevelNumber = levelNumber,
            DisplayOrder = displayOrder
        };
        
        floor.SetCreatedBy(createdBy);
        return floor;
    }

    public void Update(string name, int levelNumber, int displayOrder, Guid? updatedBy)
    {
        Name = name;
        LevelNumber = levelNumber;
        DisplayOrder = displayOrder;
        MarkAsUpdated(updatedBy);
    }
}
