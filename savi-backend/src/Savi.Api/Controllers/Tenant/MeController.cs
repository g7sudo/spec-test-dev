using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.Auth.Queries.GetMyTenantAuth;
using Savi.Application.Tenant.Me.Commands.UpdateMyAppSettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyNotificationSettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyPartyInfo;
using Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyProfile;
using Savi.Application.Tenant.Me.Commands.UpdateMyProfilePhoto;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Application.Tenant.Me.Queries.GetMyAppSettings;
using Savi.Application.Tenant.Me.Queries.GetMyHome;
using Savi.Application.Tenant.Me.Queries.GetMyNotificationSettings;
using Savi.Application.Tenant.Me.Queries.GetMyPrivacySettings;
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
    /// Gets the current user's auth context for this tenant.
    /// Returns user info, tenant context, roles, leases (for residents), and permissions.
    /// </summary>
    /// <remarks>
    /// Requires X-Tenant-Code header to identify the tenant.
    ///
    /// Response includes:
    /// - User identity (userId, tenantUserId, communityUserId)
    /// - Tenant context (tenantId, tenantCode, tenantName)
    /// - Roles in this tenant
    /// - Leases (for residents - includes unit info)
    /// - Permissions dictionary for this tenant
    /// </remarks>
    [HttpGet("auth")]
    [ProducesResponseType(typeof(TenantAuthMeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyAuth(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/auth");

        var result = await _mediator.Send(new GetMyTenantAuthQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets the current user's home information.
    /// Returns units, leases (with start and end dates), and co-residents.
    /// </summary>
    /// <remarks>
    /// Requires X-Tenant-Code header to identify the tenant.
    ///
    /// Response includes:
    /// - Units the user is associated with through active leases
    /// - Lease information (status, start date, end date, role)
    /// - Co-residents on each lease with their roles and app access status
    /// </remarks>
    [HttpGet("home")]
    [ProducesResponseType(typeof(MyHomeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyHome(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/home");

        var result = await _mediator.Send(new GetMyHomeQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
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
    /// Updates the current user's profile photo using multipart/form-data file upload.
    /// Uses POST instead of PUT for better compatibility with React Native FormData.
    /// </summary>
    /// <remarks>
    /// Accepts file upload via multipart/form-data.
    /// Supported formats: JPEG, PNG, GIF, WebP.
    /// Maximum file size: 10MB.
    /// </remarks>
    [HttpPost("profile/photo")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ProfilePhotoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<IActionResult> UpdateMyProfilePhoto(
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /tenant/me/profile/photo - Request received");
        
        // Log request details for debugging
        _logger.LogInformation("Content-Type: {ContentType}, HasFormContentType: {HasFormContentType}", 
            Request.ContentType, Request.HasFormContentType);
        
        // Check if file was received
        if (file == null)
        {
            _logger.LogWarning("No file received in request. Form keys: {FormKeys}", 
                string.Join(", ", Request.Form.Keys));
            return BadRequest(new { error = "No file provided. Please ensure the form field is named 'file'." });
        }

        _logger.LogInformation("File received: Name={FileName}, ContentType={ContentType}, Length={Length}", 
            file.FileName, file.ContentType, file.Length);

        if (file.Length == 0)
        {
            return BadRequest(new { error = "File is empty." });
        }

        try
        {
            var command = new UpdateMyProfilePhotoCommand
            {
                FileStream = file.OpenReadStream(),
                FileName = file.FileName ?? "profile-photo.jpg",
                ContentType = file.ContentType ?? "image/jpeg",
                FileSize = file.Length
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (result.IsFailure)
            {
                _logger.LogWarning("Profile photo upload failed: {Error}", result.Error);
                return BadRequest(new { error = result.Error });
            }

            return Ok(result.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while processing profile photo upload");
            return BadRequest(new { error = $"Failed to process file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets the current user's privacy/directory settings.
    /// </summary>
    [HttpGet("profile/privacy")]
    [ProducesResponseType(typeof(PrivacySettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyPrivacySettings(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/profile/privacy");

        var result = await _mediator.Send(new GetMyPrivacySettingsQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
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
    /// Gets the current user's notification preferences.
    /// </summary>
    [HttpGet("profile/notifications")]
    [ProducesResponseType(typeof(NotificationSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyNotificationSettings(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/profile/notifications");

        var result = await _mediator.Send(new GetMyNotificationSettingsQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
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

    /// <summary>
    /// Gets the current user's app settings (theme, biometric, locale).
    /// </summary>
    [HttpGet("profile/appsettings")]
    [ProducesResponseType(typeof(AppSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyAppSettings(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /tenant/me/profile/appsettings");

        var result = await _mediator.Send(new GetMyAppSettingsQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates the current user's app settings (theme, biometric, locale).
    /// </summary>
    [HttpPut("profile/appsettings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMyAppSettings(
        [FromBody] UpdateMyAppSettingsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /tenant/me/profile/appsettings");

        var command = new UpdateMyAppSettingsCommand
        {
            Theme = request.Theme,
            BiometricEnabled = request.BiometricEnabled,
            Locale = request.Locale
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Updates the current user's party (personal) information.
    /// Allows residents to enrich their records with name, phone, email, etc.
    /// </summary>
    [HttpPut("party")]
    [ProducesResponseType(typeof(UpdateMyPartyInfoResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyPartyInfo(
        [FromBody] UpdateMyPartyInfoRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /tenant/me/party");

        var command = new UpdateMyPartyInfoCommand
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error == "Community user not found." || result.Error == "Party not found for community user."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
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

/// <summary>
/// Request model for updating app settings.
/// </summary>
public record UpdateMyAppSettingsRequest(
    ThemeMode Theme,
    bool BiometricEnabled,
    string? Locale);

/// <summary>
/// Request model for updating party (personal) information.
/// </summary>
public record UpdateMyPartyInfoRequest(
    string? FirstName,
    string? LastName,
    DateOnly? DateOfBirth,
    string? PhoneNumber,
    string? Email);

#endregion

