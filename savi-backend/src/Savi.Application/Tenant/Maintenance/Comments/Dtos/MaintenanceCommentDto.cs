using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Maintenance.Comments.Dtos;

/// <summary>
/// DTO for maintenance comment.
/// </summary>
public record MaintenanceCommentDto
{
    public Guid Id { get; init; }
    public Guid MaintenanceRequestId { get; init; }
    public MaintenanceCommentType CommentType { get; init; }
    public string Message { get; init; } = string.Empty;
    public bool IsVisibleToResident { get; init; }
    public bool IsVisibleToOwner { get; init; }
    public Guid CreatedById { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }

    /// <summary>
    /// Attachments uploaded with this comment.
    /// </summary>
    public List<CommentAttachmentDto> Attachments { get; init; } = new();
}

/// <summary>
/// DTO for comment attachment.
/// </summary>
public record CommentAttachmentDto
{
    public Guid DocumentId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public string DownloadUrl { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
