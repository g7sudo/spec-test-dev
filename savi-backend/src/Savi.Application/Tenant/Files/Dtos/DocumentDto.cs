using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Files.Dtos;

/// <summary>
/// DTO for permanent document/file.
/// Includes download URL with SAS token for secure access.
/// ActionState indicates what should happen to this document (Active/Deleted).
/// </summary>
public record DocumentDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public string DownloadUrl { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public DocumentActionState ActionState { get; init; } = DocumentActionState.Active;
    public DateTime CreatedAt { get; init; }
}
