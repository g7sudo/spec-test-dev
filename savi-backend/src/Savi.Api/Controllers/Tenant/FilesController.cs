using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Files.Commands.CleanupExpiredTempFiles;
using Savi.Application.Tenant.Files.Commands.DeleteFile;
using Savi.Application.Tenant.Files.Commands.UploadPermanentFile;
using Savi.Application.Tenant.Files.Commands.UploadTempFile;
using Savi.Application.Tenant.Files.Queries.GetFileDownloadUrl;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for managing file uploads and downloads.
/// Supports both temporary uploads (before entity creation) and permanent uploads (to existing entities).
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FilesController> _logger;

    public FilesController(IMediator mediator, ILogger<FilesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Uploads a file to temporary storage.
    /// Use this endpoint when creating an entity - the temp file will be moved to permanent storage after entity creation.
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="tempKey">Optional session key for grouping uploads. If not provided, auto-generates a new GUID.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Temp file upload details including ID to reference during entity creation</returns>
    [HttpPost("temp")]
    [RequestSizeLimit(10485760)] // 10MB
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadTempFile(
        IFormFile file,
        [FromQuery] string? tempKey = null,
        CancellationToken cancellationToken = default)
    {
        var finalTempKey = tempKey ?? Guid.NewGuid().ToString();
        _logger.LogInformation("POST /tenant/files/temp - Uploading temp file: {FileName}, TempKey: {TempKey}",
            file.FileName, finalTempKey);

        var command = new UploadTempFileCommand
        {
            TempKey = finalTempKey,
            File = file
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Uploads a file directly to permanent storage for an existing entity.
    /// Use this endpoint when adding files to an entity that already exists.
    /// </summary>
    /// <param name="ownerType">Type of entity (Unit, Block, etc.)</param>
    /// <param name="ownerId">ID of the owning entity</param>
    /// <param name="category">Document category (Image, FloorPlan, etc.)</param>
    /// <param name="file">The file to upload</param>
    /// <param name="description">Optional description</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Document details including download URL</returns>
    [HttpPost]
    [RequestSizeLimit(10485760)] // 10MB
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadPermanentFile(
        [FromForm] DocumentOwnerType ownerType,
        [FromForm] Guid ownerId,
        [FromForm] DocumentCategory category,
        IFormFile file,
        [FromForm] string? description = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/files - Uploading permanent file for {OwnerType}/{OwnerId}: {FileName}",
            ownerType, ownerId, file.FileName);

        var command = new UploadPermanentFileCommand
        {
            OwnerType = ownerType,
            OwnerId = ownerId,
            Category = category,
            File = file,
            Description = description
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a download URL for a document/file.
    /// Returns a SAS URL that expires in 1 hour (configurable).
    /// </summary>
    /// <param name="id">Document ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Download URL with expiration time</returns>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.View)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetFileDownloadUrl(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetFileDownloadUrlQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Deletes a document/file.
    /// Removes both the blob from storage and the database record.
    /// </summary>
    /// <param name="id">Document ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>204 No Content on success</returns>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteFile(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("DELETE /tenant/files/{Id}", id);

        var command = new DeleteFileCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Admin cleanup endpoint to delete expired temporary files.
    /// Removes temp files older than the specified number of days.
    /// </summary>
    /// <param name="daysOld">Delete files older than this many days (default: 7)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Cleanup result with count of deleted files</returns>
    [HttpDelete("temp/cleanup")]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CleanupExpiredTempFiles(
        [FromQuery] int daysOld = 7,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("DELETE /tenant/files/temp/cleanup - Days old: {DaysOld}", daysOld);

        var command = new CleanupExpiredTempFilesCommand(daysOld);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
