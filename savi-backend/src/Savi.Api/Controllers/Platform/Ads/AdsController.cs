using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Application.Platform.Ads.Serving.Commands.RecordAdEvents;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.Application.Platform.Ads.Serving.Queries.GetBanners;
using Savi.Application.Platform.Ads.Serving.Queries.GetStories;
using Savi.Domain.Platform.Enums;

namespace Savi.Api.Controllers.Platform.Ads;

/// <summary>
/// Controller for ad serving - fetching banners/stories and recording events.
/// Used by mobile apps to display ads and track analytics.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/ads")]
[Authorize]
public class AdsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AdsController> _logger;

    public AdsController(IMediator mediator, ILogger<AdsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets banner ads for a tenant and screen placements.
    /// </summary>
    /// <param name="tenantId">The tenant ID.</param>
    /// <param name="screen">The screen name (e.g., "HOME").</param>
    /// <param name="placements">Comma-separated list of placements (e.g., "HomeTop,HomeMiddle").</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Banner ads for each requested placement.</returns>
    [HttpGet("banners")]
    [ProducesResponseType(typeof(GetBannersResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetBanners(
        [FromQuery] Guid tenantId,
        [FromQuery] string screen,
        [FromQuery] string placements,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "GET /ads/banners - TenantId: {TenantId}, Screen: {Screen}, Placements: {Placements}",
            tenantId,
            screen,
            placements);

        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant ID is required." });
        }

        if (string.IsNullOrWhiteSpace(screen))
        {
            return BadRequest(new { error = "Screen is required." });
        }

        if (string.IsNullOrWhiteSpace(placements))
        {
            return BadRequest(new { error = "Placements are required." });
        }

        // Parse placements
        var placementList = new List<AdPlacement>();
        foreach (var placement in placements.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (Enum.TryParse<AdPlacement>(placement, true, out var parsed))
            {
                placementList.Add(parsed);
            }
            else
            {
                return BadRequest(new { error = $"Invalid placement: {placement}" });
            }
        }

        var query = new GetBannersQuery(tenantId, screen, placementList);
        var result = await _mediator.Send(query, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Gets story campaigns for a tenant.
    /// </summary>
    /// <param name="tenantId">The tenant ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Story campaigns with slides.</returns>
    [HttpGet("stories")]
    [ProducesResponseType(typeof(GetStoriesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStories(
        [FromQuery] Guid tenantId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /ads/stories - TenantId: {TenantId}", tenantId);

        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant ID is required." });
        }

        var query = new GetStoriesQuery(tenantId);
        var result = await _mediator.Send(query, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Records ad events (views and clicks) in batch.
    /// </summary>
    /// <param name="request">The batch of ad events to record.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Number of accepted and rejected events.</returns>
    [HttpPost("events")]
    [ProducesResponseType(typeof(RecordAdEventsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RecordEvents(
        [FromBody] RecordAdEventsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /ads/events - Recording {EventCount} events", request.Events.Count);

        if (request.Events == null || request.Events.Count == 0)
        {
            return BadRequest(new { error = "At least one event is required." });
        }

        var command = new RecordAdEventsCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }
}
