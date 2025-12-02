using System.Text.RegularExpressions;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;

namespace Savi.Infrastructure.Storage;

/// <summary>
/// Azure Blob Storage implementation of file storage service.
/// Manages tenant-scoped file operations with temp and permanent storage.
/// </summary>
public class AzureBlobStorageService : IFileStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(
        IConfiguration configuration,
        ILogger<AzureBlobStorageService> logger)
    {
        var connectionString = configuration.GetConnectionString("AzureBlobStorage")
            ?? throw new InvalidOperationException("Azure Blob Storage connection string not configured.");

        _containerName = configuration["FileUpload:ContainerName"] ?? "savi-files";
        _blobServiceClient = new BlobServiceClient(connectionString);
        _logger = logger;

        // Ensure container exists
        EnsureContainerExistsAsync().GetAwaiter().GetResult();
    }

    public async Task<string> UploadTempFileAsync(
        Guid tenantId,
        string tempKey,
        string fileName,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var sanitizedFileName = SanitizeFileName(fileName);
        var blobPath = $"tenant-{tenantId}/temp/{tempKey}/{sanitizedFileName}";

        _logger.LogInformation("Uploading temp file: {BlobPath}", blobPath);

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        };

        await blobClient.UploadAsync(stream, uploadOptions, cancellationToken);

        _logger.LogInformation("Successfully uploaded temp file: {BlobPath}", blobPath);
        return blobPath;
    }

    public async Task<string> MoveToPermanentAsync(
        string sourceBlobPath,
        string destinationBlobPath,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Moving file from {Source} to {Destination}", sourceBlobPath, destinationBlobPath);

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var sourceBlob = containerClient.GetBlobClient(sourceBlobPath);
        var destinationBlob = containerClient.GetBlobClient(destinationBlobPath);

        // Check source exists
        if (!await sourceBlob.ExistsAsync(cancellationToken))
        {
            _logger.LogError("Source blob not found: {Source}", sourceBlobPath);
            throw new FileNotFoundException($"Source blob not found: {sourceBlobPath}");
        }

        // Copy blob (Azure copies within same storage account are instant)
        var copyOperation = await destinationBlob.StartCopyFromUriAsync(sourceBlob.Uri, cancellationToken: cancellationToken);

        // Wait for copy to complete (should be instant for same account)
        await copyOperation.WaitForCompletionAsync(cancellationToken);

        // Delete source blob after successful copy
        await sourceBlob.DeleteIfExistsAsync(cancellationToken: cancellationToken);

        _logger.LogInformation("Successfully moved file from {Source} to {Destination}", sourceBlobPath, destinationBlobPath);
        return destinationBlobPath;
    }

    public async Task<string> UploadPermanentFileAsync(
        Guid tenantId,
        string ownerType,
        Guid ownerId,
        string fileName,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var sanitizedFileName = SanitizeFileName(fileName);
        var blobPath = $"tenant-{tenantId}/{ownerType.ToLowerInvariant()}/{ownerId}/{sanitizedFileName}";

        _logger.LogInformation("Uploading permanent file: {BlobPath}", blobPath);

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        };

        await blobClient.UploadAsync(stream, uploadOptions, cancellationToken);

        _logger.LogInformation("Successfully uploaded permanent file: {BlobPath}", blobPath);
        return blobPath;
    }

    public async Task<bool> DeleteFileAsync(
        string blobPath,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting file: {BlobPath}", blobPath);

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);

        var result = await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);

        if (result.Value)
        {
            _logger.LogInformation("Successfully deleted file: {BlobPath}", blobPath);
        }
        else
        {
            _logger.LogWarning("File not found for deletion: {BlobPath}", blobPath);
        }

        return result.Value;
    }

    public async Task<string> GetDownloadUrlAsync(
        string blobPath,
        int expiresInMinutes = 60,
        CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);

        // Check if blob exists
        if (!await blobClient.ExistsAsync(cancellationToken))
        {
            _logger.LogError("Blob not found for download URL: {BlobPath}", blobPath);
            throw new FileNotFoundException($"Blob not found: {blobPath}");
        }

        // Generate SAS token for read access
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerName,
            BlobName = blobPath,
            Resource = "b", // b = blob
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Allow for clock skew
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiresInMinutes)
        };

        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasToken = blobClient.GenerateSasUri(sasBuilder);

        _logger.LogDebug("Generated SAS URL for {BlobPath}, expires in {Minutes} minutes", blobPath, expiresInMinutes);
        return sasToken.ToString();
    }

    public async Task<int> DeleteExpiredTempFilesAsync(
        Guid tenantId,
        int daysOld,
        CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTimeOffset.UtcNow.AddDays(-daysOld);
        var prefix = $"tenant-{tenantId}/temp/";
        var deletedCount = 0;

        _logger.LogInformation("Cleaning up temp files for tenant {TenantId} older than {CutoffDate}", tenantId, cutoffDate);

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

        await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: prefix, cancellationToken: cancellationToken))
        {
            if (blobItem.Properties.CreatedOn.HasValue &&
                blobItem.Properties.CreatedOn.Value < cutoffDate)
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
                deletedCount++;

                _logger.LogDebug("Deleted expired temp file: {BlobName}", blobItem.Name);
            }
        }

        _logger.LogInformation("Cleanup completed. Deleted {Count} expired temp files for tenant {TenantId}", deletedCount, tenantId);
        return deletedCount;
    }

    /// <summary>
    /// Sanitizes a file name by removing invalid characters and adding a timestamp.
    /// </summary>
    private static string SanitizeFileName(string fileName)
    {
        // Get file name without extension
        var nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
        var extension = Path.GetExtension(fileName);

        // Remove invalid path characters
        var invalidChars = Path.GetInvalidFileNameChars();
        nameWithoutExt = string.Join("_", nameWithoutExt.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));

        // Remove spaces and special characters, keep alphanumeric, dash, and underscore
        nameWithoutExt = Regex.Replace(nameWithoutExt, @"[^a-zA-Z0-9\-_]", "_");

        // Add timestamp to ensure uniqueness
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        return $"{nameWithoutExt}_{timestamp}{extension}";
    }

    /// <summary>
    /// Ensures the blob container exists, creates if it doesn't.
    /// </summary>
    private async Task EnsureContainerExistsAsync()
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
        _logger.LogInformation("Ensured blob container exists: {ContainerName}", _containerName);
    }
}
