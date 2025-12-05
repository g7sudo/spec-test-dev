using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.ResidentInvites.Commands.AcceptResidentInvite;
using Savi.Application.Tenant.ResidentInvites.Commands.CancelResidentInvite;
using Savi.Application.Tenant.ResidentInvites.Commands.CreateResidentInvite;
using Savi.Application.Tenant.ResidentInvites.Commands.ResendResidentInvite;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Application.Tenant.ResidentInvites.Queries.ListResidentInvitesByLease;
using Savi.Application.Tenant.ResidentInvites.Queries.ValidateResidentInvite;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.ResidentInvites;

/// <summary>
/// Controller for managing resident invitations.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/resident-invites")]
public class ResidentInvitesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ResidentInvitesController> _logger;

    public ResidentInvitesController(IMediator mediator, ILogger<ResidentInvitesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Validates a resident invite (public endpoint - no auth required).
    /// Used by mobile app before showing signup screen.
    /// </summary>
    [HttpGet("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ResidentInviteValidationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Validate(
        [FromQuery] Guid inviteId,
        [FromQuery] string token,
        CancellationToken cancellationToken = default)
    {
        var query = new ValidateResidentInviteQuery(inviteId, token);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Accepts a resident invite (authenticated).
    /// Called after user signs up/logs in via Firebase.
    /// </summary>
    [HttpPost("accept")]
    [Authorize]
    [ProducesResponseType(typeof(AcceptResidentInviteResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Accept(
        [FromBody] AcceptInviteRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/resident-invites/accept - Accepting invite {InviteId}",
            request.InviteId);

        var command = new AcceptResidentInviteCommand(request.InviteId, request.Token);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new resident invite for a lease.
    /// </summary>
    [HttpPost]
    [Authorize]
    [HasPermission(Permissions.Tenant.ResidentInvites.Create)]
    [ProducesResponseType(typeof(CreateResidentInviteResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateResidentInviteRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/resident-invites - Creating invite for Lease {LeaseId}, Party {PartyId}",
            request.LeaseId, request.PartyId);

        var command = new CreateResidentInviteCommand(
            request.LeaseId,
            request.PartyId,
            request.Role,
            request.Email,
            request.ExpirationDays ?? 7);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Created($"{result.Value.InviteId}", result.Value);
    }

    /// <summary>
    /// Lists resident invites for a lease.
    /// </summary>
    [HttpGet("by-lease/{leaseId:guid}")]
    [Authorize]
    [HasPermission(Permissions.Tenant.ResidentInvites.View)]
    [ProducesResponseType(typeof(PagedResult<ResidentInviteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByLease(
        Guid leaseId,
        [FromQuery] ResidentInviteStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListResidentInvitesByLeaseQuery(leaseId, status, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Cancels a pending resident invite.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [HasPermission(Permissions.Tenant.ResidentInvites.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Cancel(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/resident-invites/{Id}/cancel - Cancelling invite",
            id);

        var command = new CancelResidentInviteCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Resends a resident invite (cancels old, creates new with fresh token).
    /// </summary>
    [HttpPost("{id:guid}/resend")]
    [Authorize]
    [HasPermission(Permissions.Tenant.ResidentInvites.Manage)]
    [ProducesResponseType(typeof(CreateResidentInviteResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Resend(
        Guid id,
        [FromBody] ResendInviteRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/resident-invites/{Id}/resend - Resending invite",
            id);

        var command = new ResendResidentInviteCommand(id, request?.ExpirationDays ?? 7);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}

/// <summary>
/// Request model for accepting an invite.
/// </summary>
public record AcceptInviteRequest(Guid InviteId, string Token);

/// <summary>
/// Request model for creating a resident invite.
/// </summary>
public record CreateResidentInviteRequest(
    Guid LeaseId,
    Guid PartyId,
    LeasePartyRole Role,
    string Email,
    int? ExpirationDays
);

/// <summary>
/// Request model for resending an invite.
/// </summary>
public record ResendInviteRequest(
    int? ExpirationDays
);
