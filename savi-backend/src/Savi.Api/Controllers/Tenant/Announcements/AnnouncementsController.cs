using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Announcements.Commands.ArchiveAnnouncement;
using Savi.Application.Tenant.Announcements.Commands.CreateAnnouncement;
using Savi.Application.Tenant.Announcements.Commands.DeleteAnnouncement;
using Savi.Application.Tenant.Announcements.Commands.PinAnnouncement;
using Savi.Application.Tenant.Announcements.Commands.PublishAnnouncement;
using Savi.Application.Tenant.Announcements.Commands.UpdateAnnouncement;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.Application.Tenant.Announcements.Queries.GetAnnouncementById;
using Savi.Application.Tenant.Announcements.Queries.ListAnnouncements;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Announcements;

/// <summary>
/// Controller for managing community announcements.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/announcements")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AnnouncementsController> _logger;

    public AnnouncementsController(IMediator mediator, ILogger<AnnouncementsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a list of announcements (admin view).
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(typeof(PagedResult<AnnouncementSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAnnouncements(
        [FromQuery] AnnouncementStatus? status = null,
        [FromQuery] AnnouncementCategory? category = null,
        [FromQuery] AnnouncementPriority? priority = null,
        [FromQuery] bool? isPinned = null,
        [FromQuery] bool? isEvent = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAnnouncementsQuery(
            status, category, priority, isPinned, isEvent,
            searchTerm, fromDate, toDate,
            ResidentView: false, page, pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a list of published announcements for residents.
    /// </summary>
    [HttpGet("feed")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(PagedResult<AnnouncementSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAnnouncementsFeed(
        [FromQuery] AnnouncementCategory? category = null,
        [FromQuery] AnnouncementPriority? priority = null,
        [FromQuery] bool? isEvent = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAnnouncementsQuery(
            Status: null, category, priority, IsPinned: null, isEvent,
            searchTerm, FromDate: null, ToDate: null,
            ResidentView: true, page, pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets an announcement by ID (admin view).
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(typeof(AnnouncementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAnnouncementById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAnnouncementByIdQuery(id, ResidentView: false);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets an announcement by ID (resident view - marks as read).
    /// </summary>
    [HttpGet("{id:guid}/view")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(AnnouncementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ViewAnnouncement(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAnnouncementByIdQuery(id, ResidentView: true);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new announcement.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAnnouncement(
        [FromBody] CreateAnnouncementCommand command,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /tenant/announcements - Creating announcement: {Title}", command.Title);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetAnnouncementById),
            new { id = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Updates an existing announcement.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAnnouncement(
        Guid id,
        [FromBody] UpdateAnnouncementRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateAnnouncementCommand(
            id,
            request.Title,
            request.Body,
            request.Category,
            request.Priority,
            request.IsPinned,
            request.IsBanner,
            request.AllowLikes,
            request.AllowComments,
            request.AllowAddToCalendar,
            request.IsEvent,
            request.EventStartAt,
            request.EventEndAt,
            request.IsAllDay,
            request.EventLocationText,
            request.EventJoinUrl,
            request.Audiences,
            request.TempDocuments,
            request.DocumentsToRemove);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Publishes or schedules an announcement.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PublishAnnouncement(
        Guid id,
        [FromBody] PublishAnnouncementRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new PublishAnnouncementCommand(
            id,
            request.PublishImmediately,
            request.ScheduledAt,
            request.ExpiresAt);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Archives an announcement.
    /// </summary>
    [HttpPost("{id:guid}/archive")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ArchiveAnnouncement(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new ArchiveAnnouncementCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Pins or unpins an announcement.
    /// </summary>
    [HttpPost("{id:guid}/pin")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PinAnnouncement(
        Guid id,
        [FromBody] PinAnnouncementRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new PinAnnouncementCommand(id, request.IsPinned);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes an announcement (soft delete).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAnnouncement(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteAnnouncementCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}

/// <summary>
/// Request model for updating an announcement.
/// </summary>
public record UpdateAnnouncementRequest(
    string Title,
    string Body,
    AnnouncementCategory Category,
    AnnouncementPriority Priority,
    bool IsPinned,
    bool IsBanner,
    bool AllowLikes,
    bool AllowComments,
    bool AllowAddToCalendar,
    bool IsEvent,
    DateTime? EventStartAt,
    DateTime? EventEndAt,
    bool IsAllDay,
    string? EventLocationText,
    string? EventJoinUrl,
    List<CreateAnnouncementAudienceInput> Audiences,
    List<string>? TempDocuments = null,
    List<Guid>? DocumentsToRemove = null
);

/// <summary>
/// Request model for publishing/scheduling an announcement.
/// </summary>
public record PublishAnnouncementRequest(
    bool PublishImmediately = true,
    DateTime? ScheduledAt = null,
    DateTime? ExpiresAt = null
);

/// <summary>
/// Request model for pinning/unpinning an announcement.
/// </summary>
public record PinAnnouncementRequest(bool IsPinned);
