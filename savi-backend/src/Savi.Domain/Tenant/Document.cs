using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a permanent file/document attached to an entity (Unit, Block, etc.).
/// Stores metadata and blob path for files stored in Azure Blob Storage.
/// </summary>
public class Document : BaseEntity
{
    public DocumentOwnerType OwnerType { get; private set; }
    public Guid OwnerId { get; private set; }
    public DocumentCategory Category { get; private set; }
    public string? Title { get; private set; }
    public string? Description { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string BlobPath { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public int DisplayOrder { get; private set; }

    // EF Core constructor
    private Document() { }

    public static Document Create(
        DocumentOwnerType ownerType,
        Guid ownerId,
        DocumentCategory category,
        string fileName,
        string blobPath,
        string contentType,
        long sizeBytes,
        Guid? createdBy,
        string? title = null,
        string? description = null,
        int displayOrder = 0)
    {
        var document = new Document
        {
            OwnerType = ownerType,
            OwnerId = ownerId,
            Category = category,
            FileName = fileName,
            BlobPath = blobPath,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            Title = title,
            Description = description,
            DisplayOrder = displayOrder
        };

        document.SetCreatedBy(createdBy);
        return document;
    }

    public void UpdateMetadata(
        string? title,
        string? description,
        int displayOrder,
        Guid? updatedBy)
    {
        Title = title;
        Description = description;
        DisplayOrder = displayOrder;
        MarkAsUpdated(updatedBy);
    }

    public void UpdateDisplayOrder(int displayOrder, Guid? updatedBy)
    {
        DisplayOrder = displayOrder;
        MarkAsUpdated(updatedBy);
    }
}
