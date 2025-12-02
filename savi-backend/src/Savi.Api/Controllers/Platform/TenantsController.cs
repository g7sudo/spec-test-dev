using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Tenants.Commands.ArchiveTenant;
using Savi.Application.Platform.Tenants.Commands.CreateTenant;
using Savi.Application.Platform.Tenants.Commands.InviteTenantAdmin;
using Savi.Application.Platform.Tenants.Commands.UpdateTenant;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Application.Platform.Tenants.Queries.GetTenantById;
using Savi.Application.Platform.Tenants.Queries.GetTenants;
using Savi.Domain.Platform;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for platform-level tenant (community) management.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/tenants")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(IMediator mediator, ILogger<TenantsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a paginated list of tenants.
    /// </summary>
    /// <param name="page">Page number (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="search">Optional search term for name, code, or city.</param>
    /// <param name="status">Optional status filter.</param>
    /// <param name="isActive">Optional active status filter.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of tenants.</returns>
    [HttpGet]
    [HasPermission(Permissions.Platform.Tenants.View)]
    [ProducesResponseType(typeof(PagedResult<TenantSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTenants(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] TenantStatus? status = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/tenants - Listing tenants (page: {Page})", page);

        var query = new GetTenantsQuery(page, pageSize, search, status, isActive);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a tenant by ID.
    /// </summary>
    /// <param name="id">The tenant ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The tenant details.</returns>
    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Platform.Tenants.View)]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTenantById(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /platform/tenants/{TenantId} - Getting tenant", id);

        var query = new GetTenantByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new tenant (community).
    /// </summary>
    /// <param name="request">The tenant creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created tenant details.</returns>
    [HttpPost]
    [HasPermission(Permissions.Platform.Tenants.Manage)]
    [ProducesResponseType(typeof(CreateTenantResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateTenant(
        [FromBody] CreateTenantRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("POST /platform/tenants - Creating tenant: {TenantName}", request.Name);

        var command = new CreateTenantCommand { Request = request };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetTenantById),
            new { id = result.Value.TenantId },
            result.Value);
    }

    /// <summary>
    /// Updates an existing tenant.
    /// </summary>
    /// <param name="id">The tenant ID.</param>
    /// <param name="request">The update request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated tenant details.</returns>
    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Platform.Tenants.Update)]
    [ProducesResponseType(typeof(UpdateTenantResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateTenant(
        Guid id,
        [FromBody] UpdateTenantRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("PUT /platform/tenants/{TenantId} - Updating tenant", id);

        var command = new UpdateTenantCommand
        {
            TenantId = id,
            Request = request
        };
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
    /// Archives (soft-deletes) a tenant.
    /// </summary>
    /// <param name="id">The tenant ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content on success.</returns>
    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Platform.Tenants.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ArchiveTenant(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("DELETE /platform/tenants/{TenantId} - Archiving tenant", id);

        var command = new ArchiveTenantCommand(id);
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

    /// <summary>
    /// Invites a community admin for the specified tenant.
    /// </summary>
    [HttpPost("{tenantId:guid}/invite-admin")]
    [HasPermission(Permissions.Platform.Tenants.Manage)]
    [ProducesResponseType(typeof(InviteTenantAdminResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> InviteCommunityAdmin(
        Guid tenantId,
        [FromBody] InviteTenantAdminRequest request,
        CancellationToken cancellationToken)
    {
        var command = new InviteTenantAdminCommand
        {
            TenantId = tenantId,
            Request = request
        };

        var result = await _mediator.Send(command, cancellationToken);
        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}

