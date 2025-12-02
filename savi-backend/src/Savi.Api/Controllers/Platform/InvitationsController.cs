using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.Tenants.Commands.AcceptInvitation;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Application.Platform.Tenants.Queries.ValidateInvitation;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for invitation validation and acceptance.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/invitations")]
public class InvitationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<InvitationsController> _logger;

    public InvitationsController(IMediator mediator, ILogger<InvitationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Validates an invitation token (anonymous endpoint).
    /// </summary>
    /// <param name="token">The invitation token to validate.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Invitation details if valid.</returns>
    [HttpGet("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateInvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateInvitation(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/invitations/validate - Validating invitation token");

        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { error = "Token is required" });
        }

        var query = new ValidateInvitationQuery(token);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Accepts an invitation (requires Firebase authentication).
    /// </summary>
    /// <param name="request">The accept invitation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result of accepting the invitation.</returns>
    [HttpPost("accept")]
    [Authorize]
    [ProducesResponseType(typeof(AcceptInvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AcceptInvitation(
        [FromBody] AcceptInvitationRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/invitations/accept - Accepting invitation");

        var command = new AcceptInvitationCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
