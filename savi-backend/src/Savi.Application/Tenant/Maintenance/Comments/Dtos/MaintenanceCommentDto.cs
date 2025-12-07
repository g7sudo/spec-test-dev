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
}
