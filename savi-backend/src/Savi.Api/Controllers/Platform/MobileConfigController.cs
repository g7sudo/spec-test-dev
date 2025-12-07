using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.MobileConfig.Dtos;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for mobile app configuration.
/// Provides version info and update requirements.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/mobile-config")]
[AllowAnonymous]
public class MobileConfigController : ControllerBase
{
    private readonly ILogger<MobileConfigController> _logger;

    public MobileConfigController(ILogger<MobileConfigController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Gets the current mobile app configuration.
    /// Returns version information and whether a force update is required.
    /// </summary>
    /// <returns>Mobile configuration with version info.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(MobileConfigDto), StatusCodes.Status200OK)]
    public IActionResult GetConfig()
    {
        _logger.LogInformation("GET /platform/mobile-config");

        var config = new MobileConfigDto(
            CurrentVersion: "1.0.0",
            NewVersion: "1.0.0",
            IsForceUpdate: false
        );

        return Ok(config);
    }
}
