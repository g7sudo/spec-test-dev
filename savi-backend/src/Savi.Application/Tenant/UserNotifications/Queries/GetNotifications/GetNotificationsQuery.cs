using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.UserNotifications.Queries.GetNotifications;

/// <summary>
/// Query to get notifications for the current user with optional filtering and pagination.
/// </summary>
public record GetNotificationsQuery(
    NotificationCategory? Category = null,
    bool? IsRead = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<UserNotificationDto>>>;

/// <summary>
/// DTO representing a user notification.
/// </summary>
public record UserNotificationDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public bool IsRead { get; init; }
    public DateTime? ReadAt { get; init; }
    public string? ActionUrl { get; init; }
    public string? ReferenceType { get; init; }
    public Guid? ReferenceId { get; init; }
    public string? ImageUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}
