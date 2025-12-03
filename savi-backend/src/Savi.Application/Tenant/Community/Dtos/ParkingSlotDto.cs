using Savi.Application.Tenant.Files.Dtos;

namespace Savi.Application.Tenant.Community.Dtos;

public record ParkingSlotDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string LocationType { get; init; } = string.Empty;
    public string? LevelLabel { get; init; }
    public bool IsCovered { get; init; }
    public bool IsEVCompatible { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public Guid? AllocatedUnitId { get; init; }
    public string? AllocatedUnitNumber { get; init; }

    /// <summary>
    /// All documents (images, PDFs, etc.) attached to this parking slot.
    /// Includes ActionState to indicate if document should be deleted.
    /// </summary>
    public List<DocumentDto> Documents { get; init; } = new();

    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
