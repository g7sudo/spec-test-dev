using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Structure.Commands.AllocateParkingSlot;
using Savi.Application.Tenant.Structure.Commands.CreateParkingSlot;
using Savi.Application.Tenant.Structure.Commands.DeallocateParkingSlot;
using Savi.Application.Tenant.Structure.Commands.UpdateParkingSlot;
using Savi.Application.Tenant.Structure.Dtos;
using Savi.Application.Tenant.Structure.Queries.GetParkingSlotById;
using Savi.Application.Tenant.Structure.Queries.ListParkingSlots;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for managing parking slots in the community.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/structure/parking-slots")]
[Authorize]
public class ParkingSlotsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ParkingSlotsController> _logger;

    public ParkingSlotsController(IMediator mediator, ILogger<ParkingSlotsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of parking slots with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(PagedResult<ParkingSlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListParkingSlots(
        [FromQuery] Guid? allocatedUnitId = null,
        [FromQuery] ParkingStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListParkingSlotsQuery(allocatedUnitId, status, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a parking slot by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(ParkingSlotDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetParkingSlotById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetParkingSlotByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new parking slot.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateParkingSlot(
        [FromBody] CreateParkingSlotCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/structure/parking-slots - Creating parking slot: {Code}", command.Code);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetParkingSlotById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing parking slot.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateParkingSlot(
        Guid id,
        [FromBody] UpdateParkingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateParkingSlotCommand(
            id,
            request.Code,
            request.LocationType,
            request.LevelLabel,
            request.IsCovered,
            request.IsEVCompatible,
            request.Notes);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Allocates a parking slot to a unit.
    /// </summary>
    [HttpPost("{id:guid}/allocate")]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AllocateParkingSlot(
        Guid id,
        [FromBody] AllocateParkingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AllocateParkingSlotCommand(id, request.UnitId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Deallocates a parking slot from a unit.
    /// </summary>
    [HttpPost("{id:guid}/deallocate")]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeallocateParkingSlot(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeallocateParkingSlotCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating a parking slot.
/// </summary>
public record UpdateParkingSlotRequest(
    string Code,
    ParkingLocationType LocationType,
    string? LevelLabel,
    bool IsCovered,
    bool IsEVCompatible,
    string? Notes);

/// <summary>
/// Request model for allocating a parking slot.
/// </summary>
public record AllocateParkingSlotRequest(Guid UnitId);

