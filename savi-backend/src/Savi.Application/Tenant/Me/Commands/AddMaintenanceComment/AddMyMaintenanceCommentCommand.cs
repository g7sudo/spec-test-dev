using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.AddMaintenanceComment;

/// <summary>
/// Command to add a comment to the current user's own maintenance request.
/// CommentType is auto-set to ResidentComment, and visibility flags are auto-configured.
/// </summary>
public record AddMyMaintenanceCommentCommand : IRequest<Result<AddMyCommentResultDto>>
{
    public required Guid RequestId { get; init; }
    public required string Message { get; init; }
    public List<MyCommentAttachment> Attachments { get; init; } = new();
}

/// <summary>
/// Attachment data for resident comment upload.
/// </summary>
public record MyCommentAttachment
{
    public required Stream FileStream { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public long FileSize { get; init; }
}

/// <summary>
/// Result DTO for add my comment command.
/// </summary>
public record AddMyCommentResultDto
{
    public Guid CommentId { get; init; }
    public List<MyCommentAttachmentResultDto> Attachments { get; init; } = new();
}

/// <summary>
/// Result DTO for uploaded attachment.
/// </summary>
public record MyCommentAttachmentResultDto
{
    public Guid DocumentId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string DownloadUrl { get; init; } = string.Empty;
}
