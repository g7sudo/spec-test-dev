using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Tenants;
using Savi.SharedKernel.Authorization;

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
            nameof(CreateTenant),
            new { id = result.Value.TenantId },
            result.Value);
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

