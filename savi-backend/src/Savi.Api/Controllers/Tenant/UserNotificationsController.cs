using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.UserNotifications.Commands.MarkAllAsRead;
using Savi.Application.Tenant.UserNotifications.Commands.MarkAsRead;
using Savi.Application.Tenant.UserNotifications.Queries.GetNotifications;
using Savi.Application.Tenant.UserNotifications.Queries.GetUnreadCount;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for user notification operations.
/// Provides endpoints for the notification bell feature in mobile app.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/notifications")]
[Authorize]
public class UserNotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UserNotificationsController> _logger;

    public UserNotificationsController(IMediator mediator, ILogger<UserNotificationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current user's notifications with optional filtering and pagination.
    /// </summary>
    /// <param name="category">Filter by notification category</param>
    /// <param name="isRead">Filter by read status (true = read only, false = unread only)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of notifications</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<UserNotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] NotificationCategory? category = null,
        [FromQuery] bool? isRead = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "GET /tenant/notifications - Category: {Category}, IsRead: {IsRead}, Page: {Page}",
            category, isRead, page);

        // Clamp page size
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = new GetNotificationsQuery(category, isRead, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets the count of unread notifications for the current user.
    /// Used for displaying the notification badge on the bell icon.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Unread notification count</returns>
    [HttpGet("unread/count")]
    [ProducesResponseType(typeof(UnreadCountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/notifications/unread/count");

        var result = await _mediator.Send(new GetUnreadCountQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Marks a specific notification as read.
    /// </summary>
    /// <param name="id">Notification ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("PUT /tenant/notifications/{NotificationId}/read", id);

        var result = await _mediator.Send(new MarkAsReadCommand(id), cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error == "Notification not found.")
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Marks all notifications as read for the current user.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of notifications marked as read</returns>
    [HttpPut("read-all")]
    [ProducesResponseType(typeof(MarkAllReadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("PUT /tenant/notifications/read-all");

        var result = await _mediator.Send(new MarkAllAsReadCommand(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new MarkAllReadResponse { MarkedCount = result.Value });
    }
}

/// <summary>
/// Response DTO for mark all as read operation.
/// </summary>
public record MarkAllReadResponse
{
    public int MarkedCount { get; init; }
}
