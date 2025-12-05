using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Commands.AssignPlatformUserRoles;

/// <summary>
/// Command to assign roles to a platform user.
/// Replaces the user's roles with the provided list.
/// </summary>
public record AssignPlatformUserRolesCommand(
    Guid UserId,
    List<Guid> RoleIds
) : IRequest<Result<int>>;
