using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.Application.Platform.Ads.Analytics.Queries.GetAdvertiserAnalytics;
using Savi.Application.Platform.Ads.Analytics.Queries.GetPlatformAnalyticsOverview;
using Savi.SharedKernel.Authorization;

namespace Savi.Api.Controllers.Platform.Ads;

/// <summary>
/// Controller for ad analytics - platform-wide and advertiser-level insights.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/ads/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IMediator mediator, ILogger<AnalyticsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets platform-wide analytics overview.
    /// </summary>
    /// <param name="fromDate">Optional start date for analytics period (defaults to last 30 days).</param>
    /// <param name="toDate">Optional end date for analytics period (defaults to now).</param>
    /// <param name="topCount">Number of top items to return (default: 5).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Platform analytics overview with top performers and trends.</returns>
    [HttpGet("overview")]
    [HasPermission(Permissions.Platform.AdAnalytics.View)]
    [ProducesResponseType(typeof(PlatformAnalyticsOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int topCount = 5,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "GET /platform/ads/analytics/overview - FromDate: {FromDate}, ToDate: {ToDate}",
            fromDate,
            toDate);

        var query = new GetPlatformAnalyticsOverviewQuery(fromDate, toDate, topCount);
        var result = await _mediator.Send(query, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Gets analytics for a specific advertiser across all their campaigns.
    /// </summary>
    /// <param name="advertiserId">The advertiser ID.</param>
    /// <param name="fromDate">Optional start date for analytics period.</param>
    /// <param name="toDate">Optional end date for analytics period.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Advertiser analytics with campaign breakdowns.</returns>
    [HttpGet("advertisers/{advertiserId:guid}")]
    [HasPermission(Permissions.Platform.AdAnalytics.View)]
    [ProducesResponseType(typeof(AdvertiserAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdvertiserAnalytics(
        Guid advertiserId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "GET /platform/ads/analytics/advertisers/{AdvertiserId}",
            advertiserId);

        var query = new GetAdvertiserAnalyticsQuery(advertiserId, fromDate, toDate);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
