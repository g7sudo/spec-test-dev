using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.CreateMaintenanceRequest;

/// <summary>
/// Command to create a maintenance request from the mobile app.
/// Auto-populates UnitId and PartyId from the user's active lease.
/// Supports multiple image attachments uploaded via multipart/form-data.
/// </summary>
public record CreateMyMaintenanceRequestCommand : IRequest<Result<CreateMyMaintenanceRequestResultDto>>
{
    /// <summary>
    /// The category code for the maintenance request (e.g., "ELEC", "PLUMB", "HVAC").
    /// </summary>
    public required string CategoryCode { get; init; }

    /// <summary>
    /// Short title describing the issue.
    /// </summary>
    public required string Title { get; init; }

    /// <summary>
    /// Detailed description of the issue.
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Priority level (defaults to Normal).
    /// </summary>
    public MaintenancePriority Priority { get; init; } = MaintenancePriority.Normal;

    /// <summary>
    /// List of image attachments (file streams with metadata).
    /// </summary>
    public List<MaintenanceAttachment> Attachments { get; init; } = new();
}

/// <summary>
/// Represents a single attachment for a maintenance request.
/// </summary>
public record MaintenanceAttachment
{
    /// <summary>
    /// The file stream containing the image data.
    /// </summary>
    public required Stream FileStream { get; init; }

    /// <summary>
    /// Original file name.
    /// </summary>
    public required string FileName { get; init; }

    /// <summary>
    /// Content type/MIME type of the file.
    /// </summary>
    public required string ContentType { get; init; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long FileSize { get; init; }
}

/// <summary>
/// Result DTO for create maintenance request.
/// </summary>
public record CreateMyMaintenanceRequestResultDto
{
    /// <summary>
    /// The ID of the created maintenance request.
    /// </summary>
    public Guid RequestId { get; init; }

    /// <summary>
    /// The ticket number (e.g., MT-000123).
    /// </summary>
    public string TicketNumber { get; init; } = string.Empty;

    /// <summary>
    /// The unit number the request is for.
    /// </summary>
    public string UnitNumber { get; init; } = string.Empty;

    /// <summary>
    /// List of uploaded attachment details.
    /// </summary>
    public List<MaintenanceAttachmentResultDto> Attachments { get; init; } = new();
}

/// <summary>
/// Result DTO for an uploaded attachment.
/// </summary>
public record MaintenanceAttachmentResultDto
{
    /// <summary>
    /// The document ID.
    /// </summary>
    public Guid DocumentId { get; init; }

    /// <summary>
    /// The file name.
    /// </summary>
    public string FileName { get; init; } = string.Empty;

    /// <summary>
    /// The download URL (SAS URL with expiration).
    /// </summary>
    public string DownloadUrl { get; init; } = string.Empty;
}
