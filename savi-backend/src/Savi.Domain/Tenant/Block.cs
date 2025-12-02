using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a physical building or tower within the community.
/// </summary>
public class Block : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int DisplayOrder { get; private set; }

    // EF Core constructor
    private Block() { }

    public static Block Create(string name, string? description, int displayOrder, Guid? createdBy)
    {
        var block = new Block
        {
            Name = name,
            Description = description,
            DisplayOrder = displayOrder
        };
        
        block.SetCreatedBy(createdBy);
        return block;
    }

    public void Update(string name, string? description, int displayOrder, Guid? updatedBy)
    {
        Name = name;
        Description = description;
        DisplayOrder = displayOrder;
        MarkAsUpdated(updatedBy);
    }
}
