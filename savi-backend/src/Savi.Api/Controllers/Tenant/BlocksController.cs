using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Structure.Commands.CreateBlock;
using Savi.Application.Tenant.Structure.Commands.UpdateBlock;
using Savi.Application.Tenant.Structure.Dtos;
using Savi.Application.Tenant.Structure.Queries.GetBlockById;
using Savi.Application.Tenant.Structure.Queries.ListBlocks;
using Savi.SharedKernel;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant;

/// <summary>
/// Controller for managing blocks (buildings/towers) in the community.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/structure/blocks")]
[Authorize]
public class BlocksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<BlocksController> _logger;

    public BlocksController(IMediator mediator, ILogger<BlocksController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of all blocks with pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(PagedResult<BlockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListBlocks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListBlocksQuery(page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a block by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.View)]
    [ProducesResponseType(typeof(BlockDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBlockById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetBlockByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new block.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateBlock(
        [FromBody] CreateBlockCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/structure/blocks - Creating block: {BlockName}", command.Name);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetBlockById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing block.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Structure.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateBlock(
        Guid id,
        [FromBody] UpdateBlockRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateBlockCommand(
            id,
            request.Name,
            request.Description,
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
/// Request model for updating a block.
/// </summary>
public record UpdateBlockRequest(
    string Name,
    string? Description,
    int DisplayOrder);

