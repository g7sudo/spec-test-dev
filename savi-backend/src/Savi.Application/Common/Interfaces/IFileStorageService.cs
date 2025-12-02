namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Service for managing file storage operations in Azure Blob Storage.
/// Provides abstraction over cloud storage for tenant-scoped file operations.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to temporary storage (before entity creation).
    /// </summary>
    /// <param name="tenantId">The tenant ID for path scoping</param>
    /// <param name="tempKey">Temporary session key for grouping uploads</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="stream">File content stream</param>
    /// <param name="contentType">MIME content type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Blob path where file was stored</returns>
    Task<string> UploadTempFileAsync(
        Guid tenantId,
        string tempKey,
        string fileName,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Moves a file from temporary storage to permanent storage.
    /// Critical for transaction safety - must be atomic operation.
    /// </summary>
    /// <param name="sourceBlobPath">Current temp blob path</param>
    /// <param name="destinationBlobPath">Target permanent blob path</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>New permanent blob path</returns>
    Task<string> MoveToPermanentAsync(
        string sourceBlobPath,
        string destinationBlobPath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads a file directly to permanent storage (entity already exists).
    /// </summary>
    /// <param name="tenantId">The tenant ID for path scoping</param>
    /// <param name="ownerType">Type of entity owning the file (Unit, Block, etc.)</param>
    /// <param name="ownerId">ID of the owning entity</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="stream">File content stream</param>
    /// <param name="contentType">MIME content type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Blob path where file was stored</returns>
    Task<string> UploadPermanentFileAsync(
        Guid tenantId,
        string ownerType,
        Guid ownerId,
        string fileName,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from blob storage.
    /// </summary>
    /// <param name="blobPath">Full blob path to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteFileAsync(
        string blobPath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a temporary SAS URL for downloading/viewing a file.
    /// </summary>
    /// <param name="blobPath">Full blob path</param>
    /// <param name="expiresInMinutes">URL expiration time in minutes (default 60)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>SAS URL string with expiration</returns>
    Task<string> GetDownloadUrlAsync(
        string blobPath,
        int expiresInMinutes = 60,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes expired temporary files for a tenant (admin cleanup operation).
    /// </summary>
    /// <param name="tenantId">The tenant ID to clean up</param>
    /// <param name="daysOld">Delete files older than this many days</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of files deleted</returns>
    Task<int> DeleteExpiredTempFilesAsync(
        Guid tenantId,
        int daysOld,
        CancellationToken cancellationToken = default);
}
