using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Tenant.Amenities.Commands.CreateAmenity;
using Savi.Application.Tenant.Amenities.Commands.UpdateAmenity;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Application.Tenant.Amenities.Queries.GetAmenityAvailability;
using Savi.Application.Tenant.Amenities.Queries.GetAmenityById;
using Savi.Application.Tenant.Amenities.Queries.ListAmenities;
using Savi.Application.Tenant.Files.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.Api.Configuration;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Amenities;

/// <summary>
/// Controller for managing amenities in the community.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/amenities")]
[Authorize]
public class AmenitiesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AmenitiesController> _logger;

    public AmenitiesController(IMediator mediator, ILogger<AmenitiesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of all amenities with optional filtering and pagination.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(PagedResult<AmenitySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAmenities(
        [FromQuery] AmenityType? type = null,
        [FromQuery] AmenityStatus? status = null,
        [FromQuery] bool? isBookable = null,
        [FromQuery] bool? isVisibleInApp = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAmenitiesQuery(type, status, isBookable, isVisibleInApp, searchTerm, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets an amenity by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(AmenityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAmenityById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAmenityByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets availability for an amenity on a specific date.
    /// </summary>
    [HttpGet("{id:guid}/availability")]
    [HasPermission(Permissions.Tenant.Amenities.View)]
    [ProducesResponseType(typeof(AmenityAvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAmenityAvailability(
        Guid id,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAmenityAvailabilityQuery(id, date);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new amenity.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAmenity(
        [FromBody] CreateAmenityCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/amenities - Creating amenity: {AmenityName}", command.Name);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetAmenityById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing amenity.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Amenities.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAmenity(
        Guid id,
        [FromBody] UpdateAmenityRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateAmenityCommand(
            id,
            request.Name,
            request.Code,
            request.Type,
            request.Status,
            request.Description,
            request.LocationText,
            request.IsVisibleInApp,
            request.DisplayOrder,
            request.IsBookable,
            request.RequiresApproval,
            request.SlotDurationMinutes,
            request.OpenTime,
            request.CloseTime,
            request.CleanupBufferMinutes,
            request.MaxDaysInAdvance,
            request.MaxActiveBookingsPerUnit,
            request.MaxGuests,
            request.DepositRequired,
            request.DepositAmount,
            request.Documents,
            request.TempDocuments);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating an amenity.
/// </summary>
public record UpdateAmenityRequest(
    string Name,
    string? Code,
    AmenityType Type,
    AmenityStatus Status,
    string? Description,
    string? LocationText,
    bool IsVisibleInApp,
    int DisplayOrder,
    bool IsBookable,
    bool RequiresApproval,
    int SlotDurationMinutes,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime,
    int CleanupBufferMinutes,
    int MaxDaysInAdvance,
    int? MaxActiveBookingsPerUnit,
    int? MaxGuests,
    bool DepositRequired,
    decimal? DepositAmount,
    /// <summary>
    /// List of existing documents to manage (update or delete).
    /// </summary>
    List<DocumentManagementDto>? Documents = null,
    /// <summary>
    /// List of tempKeys for new documents to add.
    /// </summary>
    List<string>? TempDocuments = null);
