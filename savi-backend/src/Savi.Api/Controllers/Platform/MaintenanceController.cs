using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Commands.MigrateTenantDatabases;
using Savi.SharedKernel.Authorization;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for platform maintenance operations.
/// Admin-only endpoints for database migrations, cleanup, etc.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/maintenance")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MaintenanceController> _logger;

    public MaintenanceController(IMediator mediator, ILogger<MaintenanceController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Applies pending migrations to all tenant databases.
    /// Admin-only operation typically run after deployment.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Migration results for all tenants</returns>
    [HttpPost("migrate-tenant-databases")]
    [HasPermission(Permissions.Platform.Tenants.Manage)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MigrateTenantDatabases(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("POST /platform/maintenance/migrate-tenant-databases - Starting migration for all tenants");

        var command = new MigrateTenantDatabasesCommand();
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
