using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Announcements.Commands.AddAnnouncementComment;
using Savi.Application.Tenant.Announcements.Commands.DeleteAnnouncementComment;
using Savi.Application.Tenant.Announcements.Commands.HideAnnouncementComment;
using Savi.Application.Tenant.Announcements.Commands.LikeAnnouncement;
using Savi.Application.Tenant.Announcements.Dtos;
using Savi.Application.Tenant.Announcements.Queries.ListAnnouncementComments;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Announcements;

/// <summary>
/// Controller for announcement engagement (likes, comments).
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/announcements")]
[Authorize]
public class AnnouncementEngagementController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AnnouncementEngagementController> _logger;

    public AnnouncementEngagementController(IMediator mediator, ILogger<AnnouncementEngagementController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    #region Likes

    /// <summary>
    /// Likes an announcement.
    /// </summary>
    [HttpPost("{announcementId:guid}/like")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(LikeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LikeAnnouncement(
        Guid announcementId,
        CancellationToken cancellationToken = default)
    {
        var command = new LikeAnnouncementCommand(announcementId, Like: true);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new LikeResponse(result.Value, true));
    }

    /// <summary>
    /// Unlikes an announcement.
    /// </summary>
    [HttpDelete("{announcementId:guid}/like")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(LikeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UnlikeAnnouncement(
        Guid announcementId,
        CancellationToken cancellationToken = default)
    {
        var command = new LikeAnnouncementCommand(announcementId, Like: false);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new LikeResponse(result.Value, false));
    }

    #endregion

    #region Comments

    /// <summary>
    /// Gets comments for an announcement.
    /// </summary>
    [HttpGet("{announcementId:guid}/comments")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(PagedResult<AnnouncementCommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListComments(
        Guid announcementId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAnnouncementCommentsQuery(announcementId, IncludeHidden: false, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets all comments for an announcement including hidden (admin view).
    /// </summary>
    [HttpGet("{announcementId:guid}/comments/all")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(typeof(PagedResult<AnnouncementCommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAllComments(
        Guid announcementId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ListAnnouncementCommentsQuery(announcementId, IncludeHidden: true, page, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Adds a comment to an announcement.
    /// </summary>
    [HttpPost("{announcementId:guid}/comments")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddComment(
        Guid announcementId,
        [FromBody] AddAnnouncementCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddAnnouncementCommentCommand(
            announcementId,
            request.Content,
            request.ParentCommentId);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Created($"/api/v1/tenant/announcements/{announcementId}/comments", new { id = result.Value });
    }

    /// <summary>
    /// Deletes a comment (user can delete their own).
    /// </summary>
    [HttpDelete("{announcementId:guid}/comments/{commentId:guid}")]
    [HasPermission(Permissions.Tenant.Announcements.View)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteComment(
        Guid announcementId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteAnnouncementCommentCommand(commentId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Hides a comment (moderation action).
    /// </summary>
    [HttpPost("{announcementId:guid}/comments/{commentId:guid}/hide")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> HideComment(
        Guid announcementId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var command = new HideAnnouncementCommentCommand(commentId, Hide: true);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// Unhides a comment (moderation action).
    /// </summary>
    [HttpPost("{announcementId:guid}/comments/{commentId:guid}/unhide")]
    [HasPermission(Permissions.Tenant.Announcements.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UnhideComment(
        Guid announcementId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var command = new HideAnnouncementCommentCommand(commentId, Hide: false);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    #endregion
}

/// <summary>
/// Response model for like operations.
/// </summary>
public record LikeResponse(int LikeCount, bool HasLiked);

/// <summary>
/// Request model for adding an announcement comment.
/// </summary>
public record AddAnnouncementCommentRequest(string Content, Guid? ParentCommentId = null);
