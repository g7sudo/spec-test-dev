using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    /// Gets the current authenticated user's platform profile.
    /// 
    /// Returns user info, platform roles, and tenant memberships.
    /// Auto-creates PlatformUser on first login.
    /// Root admin emails are auto-assigned PLATFORM_ADMIN role.
    /// </summary>
    /// <returns>The user's platform profile.</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(MyPlatformProfileDto), StatusCodes.Status200OK)]
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
}

