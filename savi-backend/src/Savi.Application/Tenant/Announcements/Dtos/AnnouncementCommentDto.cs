namespace Savi.Application.Tenant.Announcements.Dtos;

/// <summary>
/// DTO for announcement comment.
/// </summary>
public record AnnouncementCommentDto
{
    public Guid Id { get; init; }
    public Guid AnnouncementId { get; init; }
    public string Content { get; init; } = string.Empty;
    public bool IsHidden { get; init; }
    public Guid? ParentCommentId { get; init; }

    // Author information
    public CommentAuthorDto Author { get; init; } = null!;

    // Audit
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }

    // Nested replies (for threaded view)
    public List<AnnouncementCommentDto> Replies { get; init; } = new();
}

/// <summary>
/// DTO for comment author information.
/// </summary>
public record CommentAuthorDto
{
    public Guid Id { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string? ProfileImageUrl { get; init; }
    public bool IsCurrentUser { get; init; }
}
