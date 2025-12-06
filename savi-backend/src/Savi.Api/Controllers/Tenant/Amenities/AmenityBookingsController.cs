using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.Amenities.Commands.ApproveAmenityBooking;
using Savi.Application.Tenant.Amenities.Commands.CancelAmenityBooking;
using Savi.Application.Tenant.Amenities.Commands.CompleteAmenityBooking;
using Savi.Application.Tenant.Amenities.Commands.CreateAmenityBooking;
using Savi.Application.Tenant.Amenities.Commands.RejectAmenityBooking;
using Savi.Application.Tenant.Amenities.Commands.UpdateDepositStatus;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Application.Tenant.Amenities.Queries.GetAmenityBookingById;
using Savi.Application.Tenant.Amenities.Queries.ListAmenityBookings;
using Savi.Domain.Tenant.Enums;
using Savi.Api.Configuration;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Amenities;

/// <summary>
/// Controller for managing amenity bookings.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/amenity-bookings")]
[Authorize]
public class AmenityBookingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AmenityBookingsController> _logger;

    public AmenityBookingsController(IMediator mediator, ILogger<AmenityBookingsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of amenity bookings with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(PagedResult<AmenityBookingSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAmenityBookings(
        [FromQuery] Guid? amenityId = null,
        [FromQuery] Guid? unitId = null,
        [FromQuery] AmenityBookingStatus? status = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAmenityBookingsQuery(amenityId, unitId, status, fromDate, toDate, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets an amenity booking by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(AmenityBookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAmenityBookingById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAmenityBookingByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new amenity booking.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Amenities.Book)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAmenityBooking(
        [FromBody] CreateAmenityBookingCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/amenity-bookings - Creating booking for amenity: {AmenityId}",
            command.AmenityId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetAmenityBookingById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Approves an amenity booking.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [HasPermission(Permissions.Tenant.Amenities.ApproveBookings)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApproveAmenityBooking(
        Guid id,
        [FromBody] ApproveBookingRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var command = new ApproveAmenityBookingCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Rejects an amenity booking.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [HasPermission(Permissions.Tenant.Amenities.ApproveBookings)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RejectAmenityBooking(
        Guid id,
        [FromBody] RejectBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RejectAmenityBookingCommand(id, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Cancels an amenity booking.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [HasPermission(Permissions.Tenant.Amenities.Book)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelAmenityBooking(
        Guid id,
        [FromBody] CancelBookingRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var command = new CancelAmenityBookingCommand(id, request?.Reason, request?.IsAdminCancellation ?? false);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Marks an amenity booking as completed.
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CompleteAmenityBooking(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new CompleteAmenityBookingCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Updates the deposit status for an amenity booking.
    /// </summary>
    [HttpPost("{id:guid}/deposit")]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateDepositStatus(
        Guid id,
        [FromBody] UpdateDepositStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateDepositStatusCommand(id, request.NewStatus, request.Reference);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for approving a booking.
/// </summary>
public record ApproveBookingRequest(string? AdminNotes);

/// <summary>
/// Request model for rejecting a booking.
/// </summary>
public record RejectBookingRequest(string Reason);

/// <summary>
/// Request model for cancelling a booking.
/// </summary>
public record CancelBookingRequest(string? Reason, bool IsAdminCancellation = false);

/// <summary>
/// Request model for updating deposit status.
/// </summary>
public record UpdateDepositStatusRequest(AmenityDepositStatus NewStatus, string? Reference);
