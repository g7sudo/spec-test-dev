namespace Savi.Application.Tenant.Community.Dtos;

public record FloorDto
{
    public Guid Id { get; init; }
    public Guid BlockId { get; init; }
    public string BlockName { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int LevelNumber { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
