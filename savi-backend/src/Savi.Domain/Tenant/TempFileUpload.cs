using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a temporarily uploaded file that hasn't been attached to a permanent entity yet.
/// Used during entity creation when the entity ID doesn't exist yet.
/// </summary>
public class TempFileUpload : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string TempKey { get; private set; } = string.Empty;
    public Guid UploadedByUserId { get; private set; }
    public string BlobPath { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public DateTime ExpiresAt { get; private set; }

    // EF Core constructor
    private TempFileUpload() { }

    public static TempFileUpload Create(
        Guid tenantId,
        string tempKey,
        Guid userId,
        string blobPath,
        string fileName,
        string contentType,
        long sizeBytes,
        int expiryDays = 7)
    {
        var tempFile = new TempFileUpload
        {
            TenantId = tenantId,
            TempKey = tempKey,
            UploadedByUserId = userId,
            BlobPath = blobPath,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays)
        };

        tempFile.SetCreatedBy(userId);
        return tempFile;
    }
}
