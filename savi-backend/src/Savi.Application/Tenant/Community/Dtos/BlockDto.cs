namespace Savi.Application.Tenant.Community.Dtos;

public record BlockDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
