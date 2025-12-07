using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Ads.Advertisers.Commands.CreateAdvertiser;
using Savi.Application.Platform.Ads.Advertisers.Commands.DeleteAdvertiser;
using Savi.Application.Platform.Ads.Advertisers.Commands.UpdateAdvertiser;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.Application.Platform.Ads.Advertisers.Queries.GetAdvertiserById;
using Savi.Application.Platform.Ads.Advertisers.Queries.ListAdvertisers;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Platform.Ads;

/// <summary>
/// Controller for managing advertisers in the platform's ad system.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/ads/advertisers")]
[Authorize]
public class AdvertisersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AdvertisersController> _logger;

    public AdvertisersController(IMediator mediator, ILogger<AdvertisersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Lists all advertisers with pagination and search.
    /// </summary>
    /// <param name="page">Page number (default: 1).</param>
    /// <param name="pageSize">Page size (default: 20).</param>
    /// <param name="searchTerm">Optional search term.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of advertisers.</returns>
    [HttpGet]
    [HasPermission(Permissions.Platform.Advertisers.View)]
    [ProducesResponseType(typeof(PagedResult<AdvertiserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/ads/advertisers - Listing advertisers");

        var query = new ListAdvertisersQuery(page, pageSize, searchTerm);
        var result = await _mediator.Send(query, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Gets an advertiser by ID.
    /// </summary>
    /// <param name="id">The advertiser ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The advertiser details.</returns>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Platform.Advertisers.View)]
    [ProducesResponseType(typeof(AdvertiserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/ads/advertisers/{AdvertiserId}", id);

        var query = new GetAdvertiserByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new advertiser.
    /// </summary>
    /// <param name="request">The advertiser creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created advertiser ID.</returns>
    [HttpPost]
    [HasPermission(Permissions.Platform.Advertisers.Create)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAdvertiserRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/ads/advertisers - Creating advertiser {Name}", request.Name);

        var command = new CreateAdvertiserCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value);
    }

    /// <summary>
    /// Updates an existing advertiser.
    /// </summary>
    /// <param name="id">The advertiser ID.</param>
    /// <param name="request">The advertiser update request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated advertiser ID.</returns>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Platform.Advertisers.Update)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAdvertiserRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /platform/ads/advertisers/{AdvertiserId}", id);

        var command = new UpdateAdvertiserCommand { AdvertiserId = id, Request = request };
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
    /// Deletes an advertiser.
    /// </summary>
    /// <param name="id">The advertiser ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content on success.</returns>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Platform.Advertisers.Delete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("DELETE /platform/ads/advertisers/{AdvertiserId}", id);

        var command = new DeleteAdvertiserCommand(id);
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
