using Savi.Application.Tenant.Files.Dtos;

namespace Savi.Application.Tenant.Community.Dtos;

public record UnitDto
{
    public Guid Id { get; init; }
    public Guid BlockId { get; init; }
    public string BlockName { get; init; } = string.Empty;
    public Guid FloorId { get; init; }
    public string FloorName { get; init; } = string.Empty;
    public Guid UnitTypeId { get; init; }
    public string UnitTypeName { get; init; } = string.Empty;
    public string UnitNumber { get; init; } = string.Empty;
    public decimal? AreaSqft { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Notes { get; init; }

    /// <summary>
    /// All documents (images, PDFs, etc.) attached to this unit.
    /// Includes ActionState to indicate if document should be deleted.
    /// </summary>
    public List<DocumentDto> Documents { get; init; } = new();

    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
