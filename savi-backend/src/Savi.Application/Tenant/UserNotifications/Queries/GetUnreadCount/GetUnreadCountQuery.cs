using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.UserNotifications.Queries.GetUnreadCount;

/// <summary>
/// Query to get the count of unread notifications for the current user.
/// Used for displaying the notification badge on the bell icon.
/// </summary>
public record GetUnreadCountQuery : IRequest<Result<UnreadCountDto>>;

/// <summary>
/// DTO containing the unread notification count.
/// </summary>
public record UnreadCountDto
{
    public int UnreadCount { get; init; }
}
