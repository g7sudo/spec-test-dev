using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Ownership.Dtos;
using Savi.Application.Tenant.Ownership.Queries.ListOwners;
using Savi.Application.Tenant.Ownership.Queries.ListUnitOwnershipsByParty;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Ownership;

/// <summary>
/// Controller for viewing owners (parties with ownership records).
/// Provides owner-centric view of ownership data.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/ownership/owners")]
[Authorize]
public class OwnersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OwnersController> _logger;

    public OwnersController(IMediator mediator, ILogger<OwnersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of owners with aggregated ownership information.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Ownership.View)]
    [ProducesResponseType(typeof(PagedResult<OwnerSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListOwners(
        [FromQuery] string? searchTerm = null,
        [FromQuery] PartyType? partyType = null,
        [FromQuery] bool currentOwnersOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListOwnersQuery(searchTerm, partyType, currentOwnersOnly, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets ownership history for a specific owner (party).
    /// </summary>
    [HttpGet("{partyId:guid}/ownerships")]
    [HasPermission(Permissions.Tenant.Ownership.View)]
    [ProducesResponseType(typeof(PagedResult<UnitOwnershipDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOwnerOwnerships(
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
}
