using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.Profile.Commands.Logout;
using Savi.Application.Platform.Profile.Dtos;
using Savi.Application.Platform.Profile.Queries.GetMyPlatformProfile;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for platform authentication endpoints.
/// Handles user profile and auth-related operations.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/auth")]
[Authorize]
public class PlatformAuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PlatformAuthController> _logger;

    public PlatformAuthController(IMediator mediator, ILogger<PlatformAuthController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current authenticated user's auth context.
    /// 
    /// Returns:
    /// - User profile (id, displayName, email)
    /// - Global platform roles
    /// - Tenant memberships (for scope dropdown)
    /// - Current scope (based on X-Tenant-Id header)
    /// - Context-aware permissions (platform + tenant if scope selected)
    /// 
    /// Auto-creates PlatformUser on first login.
    /// Root admin emails are auto-assigned PLATFORM_ADMIN role.
    /// </summary>
    /// <returns>The user's auth context including permissions.</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthMeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/auth/me");

        var result = await _mediator.Send(new GetMyPlatformProfileQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Logs out the current user and records an audit entry.
    /// 
    /// Note: This endpoint is for audit purposes only.
    /// The actual sign-out happens client-side via Firebase Auth.
    /// Frontend should:
    /// 1. Call this endpoint to record logout
    /// 2. Call firebase.auth().signOut()
    /// 3. Clear local storage/cookies
    /// 4. Redirect to /login
    /// </summary>
    /// <returns>Success response.</returns>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/auth/logout");

        var result = await _mediator.Send(new LogoutCommand(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "Logout recorded successfully." });
    }
}
