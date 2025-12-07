using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.Devices.Commands.RegisterDevice;
using Savi.Application.Platform.Devices.Commands.UnregisterDevice;
using Savi.Application.Platform.Devices.Commands.UpdateDeviceToken;
using Savi.Application.Platform.Devices.Dtos;
using Savi.Application.Platform.Devices.Queries.GetMyDevices;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for device registration and management for push notifications.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/devices")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DevicesController> _logger;

    public DevicesController(IMediator mediator, ILogger<DevicesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Registers a device for push notifications.
    /// If the device already exists (by DeviceId), updates the token.
    /// </summary>
    /// <param name="request">The device registration request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The registration result.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterDeviceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RegisterDeviceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RegisterDevice(
        [FromBody] RegisterDeviceRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "POST /platform/devices/register - Registering device {DeviceId}",
            request.DeviceId);

        var command = new RegisterDeviceCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        if (result.Value.IsNewRegistration)
        {
            return CreatedAtAction(
                nameof(GetMyDevices),
                result.Value);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates the FCM token for an existing device.
    /// Called when Firebase SDK refreshes the token.
    /// </summary>
    /// <param name="deviceId">The device ID.</param>
    /// <param name="request">The token update request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Success status.</returns>
    [HttpPut("{deviceId}/token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateDeviceToken(
        string deviceId,
        [FromBody] UpdateDeviceTokenRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "PUT /platform/devices/{DeviceId}/token - Updating device token",
            deviceId);

        var command = new UpdateDeviceTokenCommand
        {
            DeviceId = deviceId,
            Request = request
        };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "Device token updated successfully." });
    }

    /// <summary>
    /// Unregisters a device from push notifications.
    /// Called when user logs out or disables notifications.
    /// </summary>
    /// <param name="deviceId">The device ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Success status.</returns>
    [HttpDelete("{deviceId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UnregisterDevice(
        string deviceId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "DELETE /platform/devices/{DeviceId} - Unregistering device",
            deviceId);

        var command = new UnregisterDeviceCommand { DeviceId = deviceId };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Gets all registered devices for the current user.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of registered devices.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<DeviceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyDevices(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/devices - Listing user devices");

        var query = new GetMyDevicesQuery();
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
