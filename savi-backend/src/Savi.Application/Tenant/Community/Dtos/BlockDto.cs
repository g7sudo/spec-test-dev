using Savi.Application.Tenant.Files.Dtos;

namespace Savi.Application.Tenant.Community.Dtos;

public record BlockDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }

    /// <summary>
    /// All documents (images, PDFs, etc.) attached to this block.
    /// Includes ActionState to indicate if document should be deleted.
    /// </summary>
    public List<DocumentDto> Documents { get; init; } = new();

    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
