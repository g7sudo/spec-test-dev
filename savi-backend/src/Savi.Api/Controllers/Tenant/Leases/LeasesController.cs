using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Leases.Commands.ActivateLease;
using Savi.Application.Tenant.Leases.Commands.AddLeaseParty;
using Savi.Application.Tenant.Leases.Commands.CreateLease;
using Savi.Application.Tenant.Leases.Commands.EndLease;
using Savi.Application.Tenant.Leases.Commands.RemoveLeaseParty;
using Savi.Application.Tenant.Leases.Dtos;
using Savi.Application.Tenant.Leases.Queries.GetLeaseById;
using Savi.Application.Tenant.Leases.Queries.ListLeases;
using Savi.Application.Tenant.Leases.Queries.ListLeasesByUnit;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Leases;

/// <summary>
/// Controller for managing leases and lease parties.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/leases")]
[Authorize]
public class LeasesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<LeasesController> _logger;

    public LeasesController(IMediator mediator, ILogger<LeasesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a lease by ID with all associated parties.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Leases.View)]
    [ProducesResponseType(typeof(LeaseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetLeaseByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Lists all leases in the community with filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Leases.View)]
    [ProducesResponseType(typeof(PagedResult<LeaseSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] LeaseStatus? status = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListLeasesQuery(status, searchTerm, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Lists leases for a specific unit.
    /// </summary>
    [HttpGet("by-unit/{unitId:guid}")]
    [HasPermission(Permissions.Tenant.Leases.View)]
    [ProducesResponseType(typeof(PagedResult<LeaseSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByUnit(
        Guid unitId,
        [FromQuery] LeaseStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListLeasesByUnitQuery(unitId, status, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new lease for a unit (in Draft status).
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateLeaseCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/leases - Creating lease for Unit {UnitId}, Parties count: {PartiesCount}",
            command.UnitId,
            command.Parties?.Count ?? 0);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    /// <summary>
    /// Activates a draft lease.
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Activate(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/leases/{Id}/activate - Activating lease",
            id);

        var command = new ActivateLeaseCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Ends an active lease.
    /// </summary>
    [HttpPost("{id:guid}/end")]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> End(
        Guid id,
        [FromBody] EndLeaseRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/leases/{Id}/end - Ending lease",
            id);

        var command = new EndLeaseCommand(id, request?.TerminationReason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Adds a party to a lease.
    /// </summary>
    [HttpPost("{leaseId:guid}/parties")]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddParty(
        Guid leaseId,
        [FromBody] AddLeasePartyRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/leases/{LeaseId}/parties - Adding party {PartyId} to lease",
            leaseId, request.PartyId);

        var command = new AddLeasePartyCommand(
            leaseId,
            request.PartyId,
            request.Role,
            request.IsPrimary,
            request.MoveInDate);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Created($"{leaseId}/parties/{result.Value}", new { id = result.Value });
    }

    /// <summary>
    /// Removes a party from a lease.
    /// </summary>
    [HttpDelete("parties/{leasePartyId:guid}")]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RemoveParty(
        Guid leasePartyId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "DELETE /tenant/leases/parties/{LeasePartyId} - Removing party from lease",
            leasePartyId);

        var command = new RemoveLeasePartyCommand(leasePartyId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for ending a lease.
/// </summary>
public record EndLeaseRequest(string? TerminationReason);

/// <summary>
/// Request model for adding a party to a lease.
/// </summary>
public record AddLeasePartyRequest(
    Guid PartyId,
    LeasePartyRole Role,
    bool IsPrimary,
    DateOnly? MoveInDate
);
