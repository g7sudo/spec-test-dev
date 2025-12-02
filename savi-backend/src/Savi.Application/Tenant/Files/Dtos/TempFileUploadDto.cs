namespace Savi.Application.Tenant.Files.Dtos;

/// <summary>
/// DTO for temporary file upload response.
/// Returned when a file is uploaded to temp storage before entity creation.
/// </summary>
public record TempFileUploadDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public DateTime CreatedAt { get; init; }
}
