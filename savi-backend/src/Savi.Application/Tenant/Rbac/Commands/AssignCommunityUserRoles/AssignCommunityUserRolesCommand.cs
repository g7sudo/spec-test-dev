using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Commands.AssignCommunityUserRoles;

/// <summary>
/// Command to assign role groups to a community user.
/// Replaces the user's role groups with the provided list.
/// </summary>
public record AssignCommunityUserRolesCommand(
    Guid UserId,
    List<RoleGroupAssignmentDto> RoleGroups
) : IRequest<Result<int>>;

/// <summary>
/// DTO for role group assignment with primary designation.
/// </summary>
public record RoleGroupAssignmentDto(
    Guid RoleGroupId,
    bool IsPrimary = false
);
