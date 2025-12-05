using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Commands.UpdatePlatformRolePermissions;

/// <summary>
/// Command to update permissions for a platform role.
/// Replaces the role's permissions with the provided list.
/// </summary>
public record UpdatePlatformRolePermissionsCommand(
    Guid RoleId,
    List<Guid> PermissionIds
) : IRequest<Result<int>>;
