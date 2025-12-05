using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Platform.Rbac.Commands.AssignPlatformUserRoles;
using Savi.Application.Platform.Rbac.Commands.UpdatePlatformRolePermissions;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.Application.Platform.Rbac.Queries.GetPlatformRoleDetail;
using Savi.Application.Platform.Rbac.Queries.ListPlatformPermissions;
using Savi.Application.Platform.Rbac.Queries.ListPlatformRoles;
using Savi.Application.Platform.Rbac.Queries.ListPlatformRoleUsers;
using Savi.Application.Platform.Rbac.Queries.ListPlatformUsers;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Platform;

/// <summary>
/// Controller for platform-level RBAC management.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/platform/rbac")]
[Authorize]
public class PlatformRbacController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PlatformRbacController> _logger;

    public PlatformRbacController(IMediator mediator, ILogger<PlatformRbacController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all permissions.
    /// </summary>
    /// <param name="scope">Optional scope filter (Platform or Tenant).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of permissions.</returns>
    [HttpGet("permissions")]
    [HasPermission(Permissions.Platform.Rbac.View)]
    [ProducesResponseType(typeof(List<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPermissions(
        [FromQuery] string? scope = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/rbac/permissions - Listing permissions");

        var query = new ListPlatformPermissionsQuery(scope);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets all platform roles.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of platform roles.</returns>
    [HttpGet("roles")]
    [HasPermission(Permissions.Platform.Rbac.View)]
    [ProducesResponseType(typeof(List<PlatformRoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/rbac/roles - Listing platform roles");

        var query = new ListPlatformRolesQuery();
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a platform role detail with all permissions and their enabled state.
    /// </summary>
    /// <param name="id">The role ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Role detail with permissions.</returns>
    [HttpGet("roles/{id:guid}")]
    [HasPermission(Permissions.Platform.Rbac.View)]
    [ProducesResponseType(typeof(PlatformRoleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoleDetail(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/rbac/roles/{RoleId} - Getting role detail", id);

        var query = new GetPlatformRoleDetailQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates permissions for a platform role.
    /// </summary>
    /// <param name="id">The role ID.</param>
    /// <param name="permissionIds">The list of permission IDs to assign.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Number of changes made.</returns>
    [HttpPut("roles/{id:guid}/permissions")]
    [HasPermission(Permissions.Platform.Rbac.Manage)]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRolePermissions(
        Guid id,
        [FromBody] List<Guid> permissionIds,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "PUT /platform/rbac/roles/{RoleId}/permissions - Updating role permissions",
            id);

        var command = new UpdatePlatformRolePermissionsCommand(id, permissionIds);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets users assigned to a platform role.
    /// </summary>
    /// <param name="id">The role ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of users assigned to the role.</returns>
    [HttpGet("roles/{id:guid}/users")]
    [HasPermission(Permissions.Platform.Rbac.View)]
    [ProducesResponseType(typeof(List<RoleUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoleUsers(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/rbac/roles/{RoleId}/users - Getting role users", id);

        var query = new ListPlatformRoleUsersQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets platform users with their role assignments.
    /// </summary>
    /// <param name="page">Page number (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="search">Optional search term for email or name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of users with roles.</returns>
    [HttpGet("users")]
    [HasPermission(Permissions.Platform.Rbac.View)]
    [ProducesResponseType(typeof(PagedResult<PlatformUserRbacDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /platform/rbac/users - Listing platform users (page: {Page})", page);

        var query = new ListPlatformUsersQuery(page, pageSize, search);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Assigns roles to a platform user.
    /// </summary>
    /// <param name="id">The user ID.</param>
    /// <param name="roleIds">The list of role IDs to assign.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Number of changes made.</returns>
    [HttpPut("users/{id:guid}/roles")]
    [HasPermission(Permissions.Platform.Rbac.Manage)]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AssignUserRoles(
        Guid id,
        [FromBody] List<Guid> roleIds,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "PUT /platform/rbac/users/{UserId}/roles - Assigning user roles",
            id);

        var command = new AssignPlatformUserRolesCommand(id, roleIds);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }
}
