using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Files.Dtos;

/// <summary>
/// DTO for managing existing documents in update requests.
/// Used to mark documents as deleted or update their metadata.
/// </summary>
public record DocumentManagementDto
{
    /// <summary>ID of the existing document.</summary>
    public Guid Id { get; init; }

    /// <summary>Action to perform on this document (Active/Deleted).</summary>
    public DocumentActionState ActionState { get; init; } = DocumentActionState.Active;

    /// <summary>Optional: Update document title.</summary>
    public string? Title { get; init; }

    /// <summary>Optional: Update document description.</summary>
    public string? Description { get; init; }

    /// <summary>Optional: Update display order.</summary>
    public int? DisplayOrder { get; init; }
}
