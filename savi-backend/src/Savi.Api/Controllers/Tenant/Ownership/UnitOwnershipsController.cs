using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Ownership.Commands.CreateUnitOwnership;
using Savi.Application.Tenant.Ownership.Commands.EndOwnership;
using Savi.Application.Tenant.Ownership.Commands.TransferOwnership;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByParty;
using Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByUnit;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Ownership;

/// <summary>
/// Controller for managing unit ownership records.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/ownership/unit-ownerships")]
[Authorize]
public class UnitOwnershipsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UnitOwnershipsController> _logger;

    public UnitOwnershipsController(IMediator mediator, ILogger<UnitOwnershipsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets ownership records for a specific unit.
    /// </summary>
    [HttpGet("by-unit/{unitId:guid}")]
    [HasPermission(Permissions.Tenant.Ownership.View)]
    [ProducesResponseType(typeof(PagedResult<UnitOwnershipDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByUnit(
        Guid unitId,
        [FromQuery] bool currentOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListUnitOwnershipsByUnitQuery(unitId, currentOnly, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets ownership records for a specific party (owner).
    /// </summary>
    [HttpGet("by-party/{partyId:guid}")]
    [HasPermission(Permissions.Tenant.Ownership.View)]
    [ProducesResponseType(typeof(PagedResult<UnitOwnershipDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByParty(
        Guid partyId,
        [FromQuery] bool currentOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListUnitOwnershipsByPartyQuery(partyId, currentOnly, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new unit ownership record (add first owner or joint owner).
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Ownership.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUnitOwnershipCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/ownership/unit-ownerships - Creating ownership for Unit {UnitId}, Party {PartyId}",
            command.UnitId, command.PartyId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Created($"by-unit/{command.UnitId}", new { id = result.Value });
    }

    /// <summary>
    /// Transfers ownership from current owners to new owners.
    /// Ends all current ownerships and creates new ones.
    /// </summary>
    [HttpPost("transfer")]
    [HasPermission(Permissions.Tenant.Ownership.Manage)]
    [ProducesResponseType(typeof(List<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Transfer(
        [FromBody] TransferOwnershipCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/ownership/unit-ownerships/transfer - Transferring ownership for Unit {UnitId}",
            command.UnitId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { ownershipIds = result.Value });
    }

    /// <summary>
    /// Ends a specific ownership record.
    /// </summary>
    [HttpPost("{id:guid}/end")]
    [HasPermission(Permissions.Tenant.Ownership.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> EndOwnership(
        Guid id,
        [FromBody] EndOwnershipRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/ownership/unit-ownerships/{Id}/end - Ending ownership",
            id);

        var command = new EndOwnershipCommand(id, request.EndDate);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for ending an ownership.
/// </summary>
public record EndOwnershipRequest(DateOnly EndDate);
