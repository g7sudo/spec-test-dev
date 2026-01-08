using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Comments.Commands.AddComment;

/// <summary>
/// Command to add a comment to a maintenance request with optional attachments.
/// </summary>
public record AddCommentCommand : IRequest<Result<AddCommentResultDto>>
{
    public required Guid MaintenanceRequestId { get; init; }
    public required MaintenanceCommentType CommentType { get; init; }
    public required string Message { get; init; }
    public required bool IsVisibleToResident { get; init; }
    public required bool IsVisibleToOwner { get; init; }
    public List<CommentAttachment> Attachments { get; init; } = new();
}

/// <summary>
/// Attachment data for comment upload.
/// </summary>
public record CommentAttachment
{
    public required Stream FileStream { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public long FileSize { get; init; }
}

/// <summary>
/// Result DTO for add comment command.
/// </summary>
public record AddCommentResultDto
{
    public Guid CommentId { get; init; }
    public List<CommentAttachmentResultDto> Attachments { get; init; } = new();
}

/// <summary>
/// Result DTO for uploaded attachment.
/// </summary>
public record CommentAttachmentResultDto
{
    public Guid DocumentId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string DownloadUrl { get; init; } = string.Empty;
}
