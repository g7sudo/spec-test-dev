using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Community.Commands.CreateUnit;
using Savi.Application.Tenant.Community.Commands.UpdateUnit;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Community.Queries.GetUnitById;
using Savi.Application.Tenant.Community.Queries.ListUnits;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Community;

/// <summary>
/// Controller for managing units (apartments/flats) in the community.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/community/units")]
[Authorize]
public class UnitsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UnitsController> _logger;

    public UnitsController(IMediator mediator, ILogger<UnitsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of units with optional filtering by block/floor and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Community.View)]
    [ProducesResponseType(typeof(PagedResult<UnitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListUnits(
        [FromQuery] Guid? blockId = null,
        [FromQuery] Guid? floorId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListUnitsQuery(blockId, floorId, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a unit by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.View)]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUnitById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetUnitByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new unit.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateUnit(
        [FromBody] CreateUnitCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/community/units - Creating unit: {UnitNumber}", command.UnitNumber);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetUnitById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing unit.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateUnit(
        Guid id,
        [FromBody] UpdateUnitRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateUnitCommand(
            id,
            request.UnitTypeId,
            request.UnitNumber,
            request.AreaSqft,
            request.Status,
            request.Notes);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating a unit.
/// </summary>
public record UpdateUnitRequest(
    Guid UnitTypeId,
    string UnitNumber,
    decimal? AreaSqft,
    UnitStatus Status,
    string? Notes);

