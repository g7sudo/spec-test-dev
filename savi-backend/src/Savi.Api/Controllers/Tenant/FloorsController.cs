using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Structure.Commands.CreateFloor;
using Savi.Application.Tenant.Structure.Commands.UpdateFloor;
using Savi.Application.Tenant.Structure.Dtos;
using Savi.Application.Tenant.Structure.Queries.GetFloorById;
using Savi.Application.Tenant.Structure.Queries.ListFloorsByBlock;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for managing floors within blocks.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/structure/floors")]
[Authorize]
public class FloorsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FloorsController> _logger;

    public FloorsController(IMediator mediator, ILogger<FloorsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of floors for a specific block with pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(PagedResult<FloorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListFloorsByBlock(
        [FromQuery] Guid blockId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListFloorsByBlockQuery(blockId, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a floor by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(FloorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetFloorById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetFloorByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new floor.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateFloor(
        [FromBody] CreateFloorCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/structure/floors - Creating floor: {FloorName}", command.Name);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetFloorById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing floor.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateFloor(
        Guid id,
        [FromBody] UpdateFloorRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateFloorCommand(
            id,
            request.Name,
            request.LevelNumber,
            request.DisplayOrder);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating a floor.
/// </summary>
public record UpdateFloorRequest(
    string Name,
    int LevelNumber,
    int DisplayOrder);

