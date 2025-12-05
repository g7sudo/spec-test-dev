using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Residents.Commands.MoveOutResident;
using Savi.Application.Tenant.Residents.Dtos;
using Savi.Application.Tenant.Residents.Queries.GetResidentProfile;
using Savi.Application.Tenant.Residents.Queries.ListResidents;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Residents;

/// <summary>
/// Controller for resident-centric operations.
/// Provides a resident-focused view of the data (derived from LeaseParty + Party + Unit).
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/residents")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ResidentsController> _logger;

    public ResidentsController(IMediator mediator, ILogger<ResidentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Lists all residents with optional filters.
    /// Returns residents derived from LeaseParty records with PrimaryResident or CoResident roles.
    /// </summary>
    /// <param name="status">Filter by residency status (Current, Upcoming, Past).</param>
    /// <param name="unitId">Filter by specific unit.</param>
    /// <param name="blockId">Filter by block.</param>
    /// <param name="floorId">Filter by floor.</param>
    /// <param name="hasAppAccess">Filter by app access status.</param>
    /// <param name="searchTerm">Search by name, email, or phone.</param>
    /// <param name="page">Page number (1-based).</param>
    /// <param name="pageSize">Page size.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Leases.View)]
    [ProducesResponseType(typeof(PagedResult<ResidentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] ResidencyStatus? status = null,
        [FromQuery] Guid? unitId = null,
        [FromQuery] Guid? blockId = null,
        [FromQuery] Guid? floorId = null,
        [FromQuery] bool? hasAppAccess = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "GET /tenant/residents - Status: {Status}, Unit: {UnitId}, Block: {BlockId}, Floor: {FloorId}, HasAppAccess: {HasAppAccess}",
            status, unitId, blockId, floorId, hasAppAccess);

        var query = new ListResidentsQuery(
            status,
            unitId,
            blockId,
            floorId,
            hasAppAccess,
            searchTerm,
            page,
            pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a comprehensive resident profile by Party ID.
    /// Includes all residencies (current and past), invites, and account information.
    /// </summary>
    /// <param name="partyId">The Party ID of the resident.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet("{partyId:guid}")]
    [HasPermission(Permissions.Tenant.Leases.View)]
    [ProducesResponseType(typeof(ResidentProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetProfile(
        Guid partyId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "GET /tenant/residents/{PartyId} - Getting resident profile",
            partyId);

        var query = new GetResidentProfileQuery(partyId);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Moves out a resident from their lease.
    /// For primary residents, either ends the lease or transfers primary status.
    /// </summary>
    /// <param name="leasePartyId">The LeaseParty ID of the resident to move out.</param>
    /// <param name="request">Move-out details.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPost("{leasePartyId:guid}/move-out")]
    [HasPermission(Permissions.Tenant.Leases.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MoveOut(
        Guid leasePartyId,
        [FromBody] MoveOutRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "POST /tenant/residents/{LeasePartyId}/move-out - Moving out resident on {MoveOutDate}",
            leasePartyId, request.MoveOutDate);

        var command = new MoveOutResidentCommand(
            leasePartyId,
            request.MoveOutDate,
            request.EndLease,
            request.NewPrimaryLeasePartyId,
            request.TerminationReason);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for moving out a resident.
/// </summary>
public record MoveOutRequest(
    /// <summary>
    /// The move-out date.
    /// </summary>
    DateOnly MoveOutDate,

    /// <summary>
    /// For primary resident move-out: whether to end the entire lease.
    /// </summary>
    bool EndLease = false,

    /// <summary>
    /// When moving out the primary and not ending the lease,
    /// specify the LeaseParty ID that should become the new primary.
    /// </summary>
    Guid? NewPrimaryLeasePartyId = null,

    /// <summary>
    /// Optional termination reason if ending the lease.
    /// </summary>
    string? TerminationReason = null
);
