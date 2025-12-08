using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.ResidentInvites.Commands.AcceptResidentInvite;
using Savi.Application.Platform.ResidentInvites.Dtos;
using Savi.Application.Platform.ResidentInvites.Queries.ValidateInviteCode;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for resident invite code validation at the platform level.
/// Allows mobile apps to validate access codes without knowing the tenant.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/resident-invites")]
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
    /// Validates a resident invite access code (anonymous endpoint).
    /// Returns tenant information and invite details if valid.
    /// </summary>
    /// <param name="code">The 6-character access code to validate.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Invite details including tenant info if valid.</returns>
    /// <remarks>
    /// This endpoint is used by mobile apps when users enter their access code.
    /// No authentication is required.
    ///
    /// Response includes:
    /// - Tenant ID, code, and name
    /// - Invite ID and invitation token (for accepting)
    /// - Email, party name, unit label, and role
    /// - Expiration date
    /// </remarks>
    [HttpGet("validate-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateInviteCodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateAccessCode(
        [FromQuery] string code,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/resident-invites/validate-code - Validating access code");

        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new { error = "Access code is required" });
        }

        var query = new ValidateInviteCodeQuery(code);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        // Always return 200 with the validation result (IsValid flag indicates success)
        return Ok(result.Value);
    }

    /// <summary>
    /// Accepts a resident invite after user has signed up via Firebase.
    /// Creates UserTenantMembership and CommunityUser records.
    /// </summary>
    /// <param name="request">The accept request containing access code and invitation token.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result containing tenant and user information.</returns>
    /// <remarks>
    /// This endpoint is called after the user has:
    /// 1. Validated the access code (via /validate-code)
    /// 2. Created a Firebase account and signed in
    ///
    /// The endpoint will:
    /// - Create UserTenantMembership in Platform DB
    /// - Create CommunityUser in Tenant DB (linked to the Party from the invite)
    /// - Assign RESIDENT role to the user
    /// - Mark the invite as accepted
    ///
    /// After this call, the user can access tenant-level APIs with the X-Tenant-Code header.
    /// </remarks>
    [HttpPost("accept")]
    [Authorize]
    [ProducesResponseType(typeof(AcceptResidentInviteResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AcceptInvite(
        [FromBody] AcceptInviteRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/resident-invites/accept - Accepting invite");

        if (string.IsNullOrWhiteSpace(request.AccessCode))
        {
            return BadRequest(new { error = "Access code is required" });
        }

        if (string.IsNullOrWhiteSpace(request.InvitationToken))
        {
            return BadRequest(new { error = "Invitation token is required" });
        }

        var command = new AcceptResidentInviteCommand(request.AccessCode, request.InvitationToken);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}

/// <summary>
/// Request model for accepting a resident invite.
/// </summary>
public record AcceptInviteRequest(
    string AccessCode,
    string InvitationToken
);
