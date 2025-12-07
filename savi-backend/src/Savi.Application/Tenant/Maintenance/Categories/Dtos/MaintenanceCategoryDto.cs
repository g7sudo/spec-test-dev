namespace Savi.Application.Tenant.Maintenance.Categories.Dtos;

/// <summary>
/// DTO for maintenance category.
/// </summary>
public record MaintenanceCategoryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsDefault { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Summary DTO for maintenance category list views.
/// </summary>
public record MaintenanceCategorySummaryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsDefault { get; init; }
}
