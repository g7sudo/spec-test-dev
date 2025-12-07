using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Notifications.Commands.BroadcastNotification;
using Savi.Application.Platform.Notifications.Commands.QueueNotification;
using Savi.Application.Platform.Notifications.Dtos;
using Savi.SharedKernel.Authorization;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for managing push notifications.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(IMediator mediator, ILogger<NotificationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Queues a notification for a specific user.
    /// Called by tenant services to queue notifications.
    /// </summary>
    /// <param name="tenantId">The source tenant ID.</param>
    /// <param name="request">The notification request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The queue result.</returns>
    [HttpPost("queue")]
    [ProducesResponseType(typeof(QueueNotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> QueueNotification(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] QueueNotificationRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "POST /platform/notifications/queue - Queueing notification for user {UserId} from tenant {TenantId}",
            request.PlatformUserId,
            tenantId);

        var command = new QueueNotificationCommand
        {
            SourceTenantId = tenantId,
            Request = request
        };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Broadcasts a notification to all platform users.
    /// Platform admin only.
    /// </summary>
    /// <param name="request">The broadcast request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The broadcast result.</returns>
    [HttpPost("broadcast")]
    [HasPermission(Permissions.Platform.Notifications.Broadcast)]
    [ProducesResponseType(typeof(BroadcastNotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BroadcastNotification(
        [FromBody] BroadcastNotificationRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "POST /platform/notifications/broadcast - Broadcasting notification: {Title}",
            request.Title);

        var command = new BroadcastNotificationCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
