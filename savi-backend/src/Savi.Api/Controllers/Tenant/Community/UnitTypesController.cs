using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Community.Commands.CreateUnitType;
using Savi.Application.Tenant.Community.Commands.UpdateUnitType;
using Savi.Application.Tenant.Community.Dtos;
using Savi.Application.Tenant.Community.Queries.GetUnitTypeById;
using Savi.Application.Tenant.Community.Queries.ListUnitTypes;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Community;

/// <summary>
/// Controller for managing unit types in the community.
/// Unit types define categories like Studio, 1BHK, 2BHK, Penthouse, etc.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/community/unit-types")]
[Authorize]
public class UnitTypesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UnitTypesController> _logger;

    public UnitTypesController(IMediator mediator, ILogger<UnitTypesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of all unit types with pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Community.View)]
    [ProducesResponseType(typeof(PagedResult<UnitTypeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListUnitTypes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListUnitTypesQuery(page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a unit type by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.View)]
    [ProducesResponseType(typeof(UnitTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUnitTypeById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetUnitTypeByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new unit type.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateUnitType(
        [FromBody] CreateUnitTypeCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/community/unit-types - Creating unit type: {Name}", command.Name);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetUnitTypeById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing unit type.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Community.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateUnitType(
        Guid id,
        [FromBody] UpdateUnitTypeRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateUnitTypeCommand(
            id,
            request.Code,
            request.Name,
            request.Description,
            request.DefaultParkingSlots,
            request.DefaultOccupancyLimit);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating a unit type.
/// </summary>
public record UpdateUnitTypeRequest(
    string Code,
    string Name,
    string? Description,
    int DefaultParkingSlots,
    int? DefaultOccupancyLimit);

