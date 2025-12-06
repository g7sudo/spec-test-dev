using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.Amenities.Commands.CreateAmenityBlackout;
using Savi.Application.Tenant.Amenities.Commands.DeleteAmenityBlackout;
using Savi.Application.Tenant.Amenities.Commands.UpdateAmenityBlackout;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Application.Tenant.Amenities.Queries.GetAmenityBlackoutById;
using Savi.Application.Tenant.Amenities.Queries.ListAmenityBlackouts;
using Savi.Api.Configuration;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Amenities;

/// <summary>
/// Controller for managing amenity blackout periods.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/amenity-blackouts")]
[Authorize]
public class AmenityBlackoutsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AmenityBlackoutsController> _logger;

    public AmenityBlackoutsController(IMediator mediator, ILogger<AmenityBlackoutsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of amenity blackouts with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(PagedResult<AmenityBlackoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAmenityBlackouts(
        [FromQuery] Guid? amenityId = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] bool includePast = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAmenityBlackoutsQuery(amenityId, fromDate, toDate, includePast, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets an amenity blackout by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(AmenityBlackoutDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAmenityBlackoutById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAmenityBlackoutByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new amenity blackout period.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAmenityBlackout(
        [FromBody] CreateAmenityBlackoutCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/amenity-blackouts - Creating blackout for amenity: {AmenityId}",
            command.AmenityId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetAmenityBlackoutById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing amenity blackout period.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAmenityBlackout(
        Guid id,
        [FromBody] UpdateAmenityBlackoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateAmenityBlackoutCommand(
            id,
            request.StartDate,
            request.EndDate,
            request.Reason,
            request.AutoCancelBookings);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes (soft delete) an amenity blackout period.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAmenityBlackout(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteAmenityBlackoutCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating an amenity blackout.
/// </summary>
public record UpdateAmenityBlackoutRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    string? Reason,
    bool AutoCancelBookings = false);
