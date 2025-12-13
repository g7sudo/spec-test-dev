using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Amenities.Commands.CancelMyBooking;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Application.Tenant.Amenities.Queries.GetMyBookings;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.Application.Tenant.Maintenance.Requests.Queries.GetMyRequests;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Application.Tenant.Visitors.Queries.GetMyVisitors;
using Savi.Application.Tenant.Auth.Queries.GetMyTenantAuth;
using Savi.Application.Tenant.Me.Commands.UpdateMyAppSettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyNotificationSettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyPartyInfo;
using Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;
using Savi.Application.Tenant.Me.Commands.UpdateMyProfile;
using Savi.Application.Tenant.Me.Commands.UpdateMyProfilePhoto;
using Savi.Application.Tenant.Me.Commands.AddMaintenanceComment;
using Savi.Application.Tenant.Me.Commands.CancelMaintenanceRequest;
using Savi.Application.Tenant.Me.Commands.CreateMaintenanceRequest;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Application.Tenant.Me.Queries.GetMyAppSettings;
using Savi.Application.Tenant.Me.Queries.GetMyHome;
using Savi.Application.Tenant.Me.Queries.GetMyNotificationSettings;
using Savi.Application.Tenant.Me.Queries.GetMyPrivacySettings;
using Savi.Application.Tenant.Me.Queries.GetMyProfile;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

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

    /// <summary>
    /// Gets amenity bookings based on user's permission level.
    /// - CanViewAll: Returns all bookings
    /// - CanViewUnit: Returns bookings for user's units
    /// - CanViewOwn: Returns only user's own bookings
    /// </summary>
    /// <remarks>
    /// Requires one of: TENANT_AMENITY_VIEW, TENANT_AMENITY_BOOKING_VIEW_UNIT, or TENANT_AMENITY_BOOKING_VIEW_OWN permission.
    /// The response is filtered based on the user's highest permission level.
    /// </remarks>
    [HttpGet("bookings")]
    [HasAnyPermission(
        Permissions.Tenant.Amenities.View,
        Permissions.Tenant.Amenities.Manage,
        Permissions.Tenant.Amenities.BookingViewUnit,
        Permissions.Tenant.Amenities.BookingViewOwn)]
    [ProducesResponseType(typeof(PagedResult<AmenityBookingSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] Guid? amenityId = null,
        [FromQuery] AmenityBookingStatus? status = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/me/bookings");

        var query = new GetMyBookingsQuery(
            AmenityId: amenityId,
            Status: status,
            FromDate: fromDate,
            ToDate: toDate,
            Page: page,
            PageSize: pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Cancels an amenity booking with ownership verification.
    /// - CanManageAll: Can cancel any booking
    /// - CanManageUnit: Can cancel bookings for user's units
    /// - CanManageOwn: Can cancel only user's own bookings
    /// </summary>
    /// <remarks>
    /// Requires one of: TENANT_AMENITY_MANAGE, TENANT_AMENITY_BOOKING_MANAGE_UNIT, or TENANT_AMENITY_BOOKING_MANAGE_OWN permission.
    /// Ownership is verified based on the user's highest permission level.
    /// </remarks>
    [HttpPost("bookings/{id:guid}/cancel")]
    [HasAnyPermission(
        Permissions.Tenant.Amenities.Manage,
        Permissions.Tenant.Amenities.Book,
        Permissions.Tenant.Amenities.BookingManageUnit,
        Permissions.Tenant.Amenities.BookingManageOwn)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelMyBooking(
        Guid id,
        [FromBody] CancelMyBookingRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/me/bookings/{BookingId}/cancel", id);

        var command = new CancelMyBookingCommand(id, request?.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Gets visitor passes based on user's permission level.
    /// - CanViewAll: Returns all visitor passes
    /// - CanViewUnit: Returns visitor passes for user's units
    /// - CanViewOwn: Returns only visitor passes created by the user
    /// </summary>
    /// <remarks>
    /// Requires one of: TENANT_VISITOR_VIEW, TENANT_VISITOR_VIEW_UNIT, or TENANT_VISITOR_VIEW_OWN permission.
    /// The response is filtered based on the user's highest permission level.
    /// </remarks>
    [HttpGet("visitors")]
    [HasAnyPermission(
        Permissions.Tenant.Visitors.View,
        Permissions.Tenant.Visitors.Manage,
        Permissions.Tenant.Visitors.ViewUnit,
        Permissions.Tenant.Visitors.ViewOwn)]
    [ProducesResponseType(typeof(PagedResult<VisitorPassSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyVisitors(
        [FromQuery] VisitorPassStatus? status = null,
        [FromQuery] VisitorType? visitType = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/me/visitors");

        var query = new GetMyVisitorsQuery(
            Status: status,
            VisitType: visitType,
            FromDate: fromDate,
            ToDate: toDate,
            Page: page,
            PageSize: pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets maintenance requests based on user's permission level.
    /// - CanViewAll: Returns all maintenance requests
    /// - CanViewUnit: Returns maintenance requests for user's units
    /// - CanViewOwn: Returns only maintenance requests submitted by the user
    /// </summary>
    /// <remarks>
    /// Requires one of: TENANT_MAINTENANCE_REQUEST_VIEW, TENANT_MAINTENANCE_REQUEST_VIEW_UNIT, or TENANT_MAINTENANCE_REQUEST_VIEW_OWN permission.
    /// The response is filtered based on the user's highest permission level.
    /// </remarks>
    [HttpGet("requests")]
    [HasAnyPermission(
        Permissions.Tenant.Maintenance.RequestView,
        Permissions.Tenant.Maintenance.RequestManage,
        Permissions.Tenant.Maintenance.RequestViewUnit,
        Permissions.Tenant.Maintenance.RequestViewOwn)]
    [ProducesResponseType(typeof(PagedResult<MaintenanceRequestSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] MaintenanceStatus? status = null,
        [FromQuery] MaintenancePriority? priority = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/me/requests");

        var query = new GetMyRequestsQuery(
            Status: status,
            Priority: priority,
            FromDate: fromDate,
            ToDate: toDate,
            Page: page,
            PageSize: pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new maintenance request with optional image attachments.
    /// Auto-populates UnitId and PartyId from the user's active lease.
    /// This endpoint is designed for mobile app usage with multipart/form-data.
    /// </summary>
    /// <remarks>
    /// Accepts file upload via multipart/form-data.
    /// Supported image formats: JPEG, PNG, GIF, WebP, HEIC.
    /// Maximum 5 attachments, 10MB each.
    ///
    /// The UnitId and RequestedForParty are automatically determined from the user's active lease.
    /// Source is automatically set to MobileApp.
    /// </remarks>
    [HttpPost("requests")]
    [Consumes("multipart/form-data")]
    [HasAnyPermission(
        Permissions.Tenant.Maintenance.RequestCreate,
        Permissions.Tenant.Maintenance.RequestCreateOwn,
        Permissions.Tenant.Maintenance.RequestCreateUnit)]
    [ProducesResponseType(typeof(CreateMyMaintenanceRequestResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [RequestSizeLimit(52428800)] // 50MB total (5 files * 10MB)
    public async Task<IActionResult> CreateMaintenanceRequest(
        [FromForm] string categoryCode,
        [FromForm] string title,
        [FromForm] string? description = null,
        [FromForm] MaintenancePriority priority = MaintenancePriority.Normal,
        [FromForm] List<IFormFile>? attachments = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/me/requests - Creating maintenance request: {Title}, Category: {CategoryCode}", title, categoryCode);

        // Build attachments list from form files
        var attachmentList = new List<MaintenanceAttachment>();
        if (attachments != null)
        {
            foreach (var file in attachments)
            {
                if (file.Length > 0)
                {
                    attachmentList.Add(new MaintenanceAttachment
                    {
                        FileStream = file.OpenReadStream(),
                        FileName = file.FileName ?? $"attachment-{DateTime.UtcNow:yyyyMMddHHmmss}.jpg",
                        ContentType = file.ContentType ?? "image/jpeg",
                        FileSize = file.Length
                    });
                }
            }
        }

        var command = new CreateMyMaintenanceRequestCommand
        {
            CategoryCode = categoryCode,
            Title = title,
            Description = description,
            Priority = priority,
            Attachments = attachmentList
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to create maintenance request: {Error}", result.Error);
            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation(
            "Created maintenance request {TicketNumber} with {AttachmentCount} attachments",
            result.Value.TicketNumber,
            result.Value.Attachments.Count);

        return CreatedAtAction(
            nameof(GetMyRequests),
            new { id = result.Value.RequestId },
            result.Value);
    }

    /// <summary>
    /// Cancels a maintenance request that was created by the current user.
    /// Only allows cancellation of Open or Assigned requests.
    /// </summary>
    /// <remarks>
    /// Ownership validation ensures users can only cancel their own requests.
    /// A cancellation reason is required.
    /// </remarks>
    [HttpPost("requests/{id:guid}/cancel")]
    [HasAnyPermission(
        Permissions.Tenant.Maintenance.RequestCreate,
        Permissions.Tenant.Maintenance.RequestCreateOwn,
        Permissions.Tenant.Maintenance.RequestCreateUnit)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelMyRequest(
        Guid id,
        [FromBody] CancelMyMaintenanceRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/me/requests/{RequestId}/cancel", id);

        var command = new CancelMyMaintenanceRequestCommand(id, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Adds a comment to a maintenance request that was created by the current user.
    /// Comment type is automatically set to ResidentUpdate with visibility to resident and owner.
    /// </summary>
    /// <remarks>
    /// Ownership validation ensures users can only add comments to their own requests.
    /// </remarks>
    [HttpPost("requests/{id:guid}/comments")]
    [HasAnyPermission(
        Permissions.Tenant.Maintenance.RequestCreate,
        Permissions.Tenant.Maintenance.RequestCreateOwn,
        Permissions.Tenant.Maintenance.RequestCreateUnit)]
    [ProducesResponseType(typeof(AddMyMaintenanceCommentResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddMyRequestComment(
        Guid id,
        [FromBody] AddMyMaintenanceCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/me/requests/{RequestId}/comments", id);

        var command = new AddMyMaintenanceCommentCommand(id, request.Message);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Created($"/tenant/me/requests/{id}/comments/{result.Value}", new AddMyMaintenanceCommentResultDto(result.Value));
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

/// <summary>
/// Request model for cancelling an amenity booking.
/// </summary>
public record CancelMyBookingRequest(string? Reason);

/// <summary>
/// Request model for cancelling a maintenance request.
/// </summary>
public record CancelMyMaintenanceRequest(string Reason);

/// <summary>
/// Request model for adding a comment to a maintenance request.
/// </summary>
public record AddMyMaintenanceCommentRequest(string Message);

/// <summary>
/// Result DTO for adding a comment to a maintenance request.
/// </summary>
public record AddMyMaintenanceCommentResultDto(Guid CommentId);

#endregion

