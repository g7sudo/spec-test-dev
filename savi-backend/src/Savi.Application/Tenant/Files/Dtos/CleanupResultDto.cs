namespace Savi.Application.Tenant.Files.Dtos;

/// <summary>
/// DTO for temp file cleanup operation result.
/// Used by admin cleanup endpoint.
/// </summary>
public record CleanupResultDto
{
    public int DeletedCount { get; init; }
    public Guid TenantId { get; init; }
}
