using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Savi.Api.Configuration;
using Savi.Application.Tenant.Rbac.Commands.AssignCommunityUserRoles;
using Savi.Application.Tenant.Rbac.Commands.UpdateRoleGroupPermissions;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.Application.Tenant.Rbac.Queries.GetRoleGroupDetail;
using Savi.Application.Tenant.Rbac.Queries.ListCommunityUsers;
using Savi.Application.Tenant.Rbac.Queries.ListRoleGroupUsers;
using Savi.Application.Tenant.Rbac.Queries.ListRoleGroups;
using Savi.Application.Tenant.Rbac.Queries.ListTenantPermissions;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Api.Controllers.Tenant.Rbac;

/// <summary>
/// Controller for tenant-level RBAC management.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/tenant/rbac")]
[Authorize]
public class TenantRbacController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TenantRbacController> _logger;

    public TenantRbacController(IMediator mediator, ILogger<TenantRbacController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all tenant-scoped permissions.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of tenant permissions.</returns>
    [HttpGet("permissions")]
    [HasPermission(Permissions.Tenant.Rbac.View)]
    [ProducesResponseType(typeof(List<TenantPermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPermissions(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/rbac/permissions - Listing tenant permissions");

        var query = new ListTenantPermissionsQuery();
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets all role groups in the tenant.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of role groups.</returns>
    [HttpGet("roles")]
    [HasPermission(Permissions.Tenant.Rbac.View)]
    [ProducesResponseType(typeof(List<RoleGroupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/rbac/roles - Listing role groups");

        var query = new ListRoleGroupsQuery();
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a role group detail with all permissions and their enabled state.
    /// </summary>
    /// <param name="id">The role group ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Role group detail with permissions.</returns>
    [HttpGet("roles/{id:guid}")]
    [HasPermission(Permissions.Tenant.Rbac.View)]
    [ProducesResponseType(typeof(RoleGroupDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoleDetail(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/rbac/roles/{RoleGroupId} - Getting role group detail", id);

        var query = new GetRoleGroupDetailQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates permissions for a role group.
    /// </summary>
    /// <param name="id">The role group ID.</param>
    /// <param name="permissionKeys">The list of permission keys to assign.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Number of changes made.</returns>
    [HttpPut("roles/{id:guid}/permissions")]
    [HasPermission(Permissions.Tenant.Rbac.Manage)]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRolePermissions(
        Guid id,
        [FromBody] List<string> permissionKeys,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "PUT /tenant/rbac/roles/{RoleGroupId}/permissions - Updating role group permissions",
            id);

        var command = new UpdateRoleGroupPermissionsCommand(id, permissionKeys);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets users assigned to a role group.
    /// </summary>
    /// <param name="id">The role group ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of users assigned to the role group.</returns>
    [HttpGet("roles/{id:guid}/users")]
    [HasPermission(Permissions.Tenant.Rbac.View)]
    [ProducesResponseType(typeof(List<RoleGroupUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoleUsers(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/rbac/roles/{RoleGroupId}/users - Getting role group users", id);

        var query = new ListRoleGroupUsersQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets community users with their role group assignments.
    /// </summary>
    /// <param name="page">Page number (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="search">Optional search term for name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of users with role groups.</returns>
    [HttpGet("users")]
    [HasPermission(Permissions.Tenant.Rbac.View)]
    [ProducesResponseType(typeof(PagedResult<CommunityUserRbacDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GET /tenant/rbac/users - Listing community users (page: {Page})", page);

        var query = new ListCommunityUsersQuery(page, pageSize, search);
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Assigns role groups to a community user.
    /// </summary>
    /// <param name="id">The user ID.</param>
    /// <param name="roleGroups">The list of role groups to assign.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Number of changes made.</returns>
    [HttpPut("users/{id:guid}/roles")]
    [HasPermission(Permissions.Tenant.Rbac.Manage)]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AssignUserRoles(
        Guid id,
        [FromBody] List<RoleGroupAssignmentDto> roleGroups,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "PUT /tenant/rbac/users/{UserId}/roles - Assigning user role groups",
            id);

        var command = new AssignCommunityUserRolesCommand(id, roleGroups);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }
}
