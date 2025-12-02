using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.Me.Commands.UpdateMyNotificationSettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyProfile;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Application.Tenant.Me.Queries.GetMyProfile;
using Savi.Domain.Tenant.Enums;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for tenant-level "me" operations - current user's profile and preferences.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MeController> _logger;

    public MeController(IMediator mediator, ILogger<MeController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current user's community profile.
    /// Creates a default profile if one doesn't exist.
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(MyCommunityProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/profile");

        var result = await _mediator.Send(new GetMyProfileQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Community user not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates the current user's display profile settings (name, about me, photo).
    /// </summary>
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateMyProfileRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /tenant/me/profile");

        var command = new UpdateMyProfileCommand
        {
            DisplayName = request.DisplayName,
            AboutMe = request.AboutMe,
            ProfilePhotoDocumentId = request.ProfilePhotoDocumentId,
            TempProfilePhoto = request.TempProfilePhoto
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Updates the current user's privacy/directory settings.
    /// </summary>
    [HttpPut("profile/privacy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMyPrivacySettings(
        [FromBody] UpdateMyPrivacySettingsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /tenant/me/profile/privacy");

        var command = new UpdateMyPrivacySettingsCommand
        {
            DirectoryVisibility = request.DirectoryVisibility,
            ShowInDirectory = request.ShowInDirectory,
            ShowNameInDirectory = request.ShowNameInDirectory,
            ShowUnitInDirectory = request.ShowUnitInDirectory,
            ShowPhoneInDirectory = request.ShowPhoneInDirectory,
            ShowEmailInDirectory = request.ShowEmailInDirectory,
            ShowProfilePhotoInDirectory = request.ShowProfilePhotoInDirectory
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Updates the current user's notification preferences.
    /// </summary>
    [HttpPut("profile/notifications")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMyNotificationSettings(
        [FromBody] UpdateMyNotificationSettingsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /tenant/me/profile/notifications");

        var command = new UpdateMyNotificationSettingsCommand
        {
            PushEnabled = request.PushEnabled,
            EmailEnabled = request.EmailEnabled,
            NotifyMaintenanceUpdates = request.NotifyMaintenanceUpdates,
            NotifyAmenityBookings = request.NotifyAmenityBookings,
            NotifyVisitorAtGate = request.NotifyVisitorAtGate,
            NotifyAnnouncements = request.NotifyAnnouncements,
            NotifyMarketplace = request.NotifyMarketplace
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

#region Request Models

/// <summary>
/// Request model for updating profile display settings.
/// </summary>
public record UpdateMyProfileRequest(
    string? DisplayName,
    string? AboutMe,
    Guid? ProfilePhotoDocumentId,
    string? TempProfilePhoto);

/// <summary>
/// Request model for updating privacy/directory settings.
/// </summary>
public record UpdateMyPrivacySettingsRequest(
    DirectoryVisibilityScope DirectoryVisibility,
    bool ShowInDirectory,
    bool ShowNameInDirectory,
    bool ShowUnitInDirectory,
    bool ShowPhoneInDirectory,
    bool ShowEmailInDirectory,
    bool ShowProfilePhotoInDirectory);

/// <summary>
/// Request model for updating notification preferences.
/// </summary>
public record UpdateMyNotificationSettingsRequest(
    bool PushEnabled,
    bool EmailEnabled,
    bool NotifyMaintenanceUpdates,
    bool NotifyAmenityBookings,
    bool NotifyVisitorAtGate,
    bool NotifyAnnouncements,
    bool NotifyMarketplace);

#endregion

