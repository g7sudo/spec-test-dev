using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Visitors.Commands.ApproveVisitorPass;
using Savi.Application.Tenant.Visitors.Commands.CheckInVisitorPass;
using Savi.Application.Tenant.Visitors.Commands.CheckOutVisitorPass;
using Savi.Application.Tenant.Visitors.Commands.CreateVisitorPass;
using Savi.Application.Tenant.Visitors.Commands.CreateWalkInVisitorPass;
using Savi.Application.Tenant.Visitors.Commands.RejectVisitorPass;
using Savi.Application.Tenant.Visitors.Dtos;
using Savi.Application.Tenant.Visitors.Queries.GetVisitorOverview;
using Savi.Application.Tenant.Visitors.Queries.GetVisitorPassByAccessCode;
using Savi.Application.Tenant.Visitors.Queries.GetVisitorPassById;
using Savi.Application.Tenant.Visitors.Queries.ListVisitorPasses;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Visitors;

/// <summary>
/// Controller for managing visitor passes.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/visitors/passes")]
[Authorize]
public class VisitorPassesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<VisitorPassesController> _logger;

    public VisitorPassesController(IMediator mediator, ILogger<VisitorPassesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets visitor overview statistics for admin dashboard.
    /// </summary>
    [HttpGet("overview")]
    [HasPermission(Permissions.Tenant.Visitors.Manage)]
    [ProducesResponseType(typeof(VisitorOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] DateTime? date = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetVisitorOverviewQuery(date);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a list of visitor passes with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Visitors.View)]
    [ProducesResponseType(typeof(PagedResult<VisitorPassSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListPasses(
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? unitId = null,
        [FromQuery] VisitorPassStatus? status = null,
        [FromQuery] VisitorType? visitType = null,
        [FromQuery] VisitorSource? source = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] bool? currentlyInside = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListVisitorPassesQuery(
            searchTerm, unitId, status, visitType, source,
            fromDate, toDate, currentlyInside, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a visitor pass by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Visitors.View)]
    [ProducesResponseType(typeof(VisitorPassDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPassById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetVisitorPassByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a visitor pass by its access code (for security gate use).
    /// </summary>
    [HttpGet("by-code/{accessCode}")]
    [HasPermission(Permissions.Tenant.Visitors.Manage)]
    [ProducesResponseType(typeof(VisitorPassDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPassByAccessCode(
        string accessCode,
        CancellationToken cancellationToken = default)
    {
        var query = new GetVisitorPassByAccessCodeQuery(accessCode);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new pre-registered visitor pass (resident flow).
    /// Returns the pass ID and shareable access code.
    /// </summary>
    [HttpPost]
    [HasAnyPermission(
        Permissions.Tenant.Visitors.Create,
        Permissions.Tenant.Visitors.CreateUnit,
        Permissions.Tenant.Visitors.CreateOwn)]
    [ProducesResponseType(typeof(CreateVisitorPassResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreatePass(
        [FromBody] CreateVisitorPassCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/visitors/passes - Creating pass for unit: {UnitId}", command.UnitId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetPassById),
            new { id = result.Value.Id },
            result.Value);
    }

    /// <summary>
    /// Creates a walk-in visitor pass (security guard flow).
    /// Creates a pass with AtGatePendingApproval status.
    /// </summary>
    [HttpPost("walk-in")]
    [HasPermission(Permissions.Tenant.Visitors.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateWalkInPass(
        [FromBody] CreateWalkInVisitorPassCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/visitors/passes/walk-in - Creating walk-in pass for unit: {UnitId}", command.UnitId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetPassById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Approves a visitor pass (resident approval for walk-in visitors).
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [HasAnyPermission(
        Permissions.Tenant.Visitors.Create,
        Permissions.Tenant.Visitors.CreateUnit,
        Permissions.Tenant.Visitors.CreateOwn)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApprovePass(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new ApproveVisitorPassCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Rejects a visitor pass (resident rejection for walk-in visitors).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [HasAnyPermission(
        Permissions.Tenant.Visitors.Create,
        Permissions.Tenant.Visitors.CreateUnit,
        Permissions.Tenant.Visitors.CreateOwn)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RejectPass(
        Guid id,
        [FromBody] RejectVisitorPassRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new RejectVisitorPassCommand(id, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Checks in a visitor at the gate.
    /// </summary>
    [HttpPost("{id:guid}/check-in")]
    [HasPermission(Permissions.Tenant.Visitors.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CheckInPass(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new CheckInVisitorPassCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Checks out a visitor.
    /// </summary>
    [HttpPost("{id:guid}/check-out")]
    [HasPermission(Permissions.Tenant.Visitors.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CheckOutPass(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new CheckOutVisitorPassCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for rejecting a visitor pass.
/// </summary>
public record RejectVisitorPassRequest(string? Reason = null);
