namespace Savi.Application.Tenant.Files.Dtos;

/// <summary>
/// DTO for file download URL response.
/// Contains SAS URL with expiration time.
/// </summary>
public record FileDownloadDto
{
    public string DownloadUrl { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
}
