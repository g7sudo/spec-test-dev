using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Commands.UpdateRoleGroupPermissions;

/// <summary>
/// Command to update permissions for a role group.
/// Replaces the role group's permissions with the provided list.
/// </summary>
public record UpdateRoleGroupPermissionsCommand(
    Guid RoleGroupId,
    List<string> PermissionKeys
) : IRequest<Result<int>>;
