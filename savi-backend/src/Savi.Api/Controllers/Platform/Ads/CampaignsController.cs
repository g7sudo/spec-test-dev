using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Ads.Campaigns.Commands.AddBannerCreative;
using Savi.Application.Platform.Ads.Campaigns.Commands.AddStorySlide;
using Savi.Application.Platform.Ads.Campaigns.Commands.CreateCampaign;
using Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCampaign;
using Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCreative;
using Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaign;
using Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaignStatus;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.Application.Platform.Ads.Analytics.Queries.GetCampaignAnalytics;
using Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignById;
using Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignCreatives;
using Savi.Application.Platform.Ads.Campaigns.Queries.ListCampaigns;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Platform.Ads;

/// <summary>
/// Controller for managing advertising campaigns and creatives.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/ads/campaigns")]
[Authorize]
public class CampaignsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CampaignsController> _logger;

    public CampaignsController(IMediator mediator, ILogger<CampaignsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Lists all campaigns with pagination and filters.
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Platform.Campaigns.View)]
    [ProducesResponseType(typeof(PagedResult<CampaignDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? advertiserId = null,
        [FromQuery] CampaignType? type = null,
        [FromQuery] CampaignStatus? status = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/ads/campaigns - Listing campaigns");

        var query = new ListCampaignsQuery(page, pageSize, advertiserId, type, status, searchTerm);
        var result = await _mediator.Send(query, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Gets a campaign by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Platform.Campaigns.View)]
    [ProducesResponseType(typeof(CampaignDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/ads/campaigns/{CampaignId}", id);

        var query = new GetCampaignByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets analytics for a specific campaign.
    /// </summary>
    /// <param name="id">The campaign ID.</param>
    /// <param name="fromDate">Optional start date for analytics period.</param>
    /// <param name="toDate">Optional end date for analytics period.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Campaign analytics with breakdowns.</returns>
    [HttpGet("{id:guid}/analytics")]
    [HasPermission(Permissions.Platform.AdAnalytics.View)]
    [ProducesResponseType(typeof(CampaignAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAnalytics(
        Guid id,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/ads/campaigns/{CampaignId}/analytics", id);

        var query = new GetCampaignAnalyticsQuery(id, fromDate, toDate);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new campaign.
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Platform.Campaigns.Create)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCampaignRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/ads/campaigns - Creating campaign {Name}", request.Name);

        var command = new CreateCampaignCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value);
    }

    /// <summary>
    /// Updates an existing campaign.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Platform.Campaigns.Update)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCampaignRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /platform/ads/campaigns/{CampaignId}", id);

        var command = new UpdateCampaignCommand { CampaignId = id, Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates the status of a campaign (activate, pause, end).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [HasPermission(Permissions.Platform.Campaigns.ManageStatus)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateCampaignStatusRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PATCH /platform/ads/campaigns/{CampaignId}/status - {Status}", id, request.Status);

        var command = new UpdateCampaignStatusCommand(id, request.Status);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = $"Campaign status updated to {request.Status}." });
    }

    /// <summary>
    /// Deletes a campaign.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Platform.Campaigns.Delete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("DELETE /platform/ads/campaigns/{CampaignId}", id);

        var command = new DeleteCampaignCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    // ==================== CREATIVES ====================

    /// <summary>
    /// Gets all creatives for a campaign.
    /// </summary>
    [HttpGet("{id:guid}/creatives")]
    [HasPermission(Permissions.Platform.Campaigns.View)]
    [ProducesResponseType(typeof(List<CampaignCreativeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCreatives(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/ads/campaigns/{CampaignId}/creatives", id);

        var query = new GetCampaignCreativesQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Adds a banner creative to a campaign.
    /// </summary>
    [HttpPost("{id:guid}/creatives/banner")]
    [HasPermission(Permissions.Platform.Campaigns.Update)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddBannerCreative(
        Guid id,
        [FromBody] CreateBannerCreativeRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/ads/campaigns/{CampaignId}/creatives/banner - {Placement}", id, request.Placement);

        var command = new AddBannerCreativeCommand { CampaignId = id, Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetCreatives), new { id }, result.Value);
    }

    /// <summary>
    /// Adds a story slide creative to a campaign.
    /// </summary>
    [HttpPost("{id:guid}/creatives/story-slide")]
    [HasPermission(Permissions.Platform.Campaigns.Update)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddStorySlide(
        Guid id,
        [FromBody] CreateStorySlideRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/ads/campaigns/{CampaignId}/creatives/story-slide - Sequence {Sequence}", id, request.Sequence);

        var command = new AddStorySlideCommand { CampaignId = id, Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetCreatives), new { id }, result.Value);
    }

    /// <summary>
    /// Deletes a creative from a campaign.
    /// </summary>
    [HttpDelete("creatives/{creativeId:guid}")]
    [HasPermission(Permissions.Platform.Campaigns.Update)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteCreative(Guid creativeId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("DELETE /platform/ads/campaigns/creatives/{CreativeId}", creativeId);

        var command = new DeleteCreativeCommand(creativeId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}
