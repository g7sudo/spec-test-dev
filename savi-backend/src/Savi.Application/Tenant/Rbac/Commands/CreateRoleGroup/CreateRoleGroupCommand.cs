using MediatR;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Commands.CreateRoleGroup;

/// <summary>
/// Command to create a new role group in the tenant.
/// </summary>
/// <param name="Name">Display name for the role group.</param>
/// <param name="Code">Unique code (optional - auto-generated if not provided).</param>
/// <param name="Description">Description of the role group.</param>
/// <param name="GroupType">Type of role group (System, Staff, Resident, Other).</param>
public record CreateRoleGroupCommand(
    string Name,
    string? Code = null,
    string? Description = null,
    RoleGroupType GroupType = RoleGroupType.Other
) : IRequest<Result<CreateRoleGroupResult>>;

/// <summary>
/// Result of creating a role group.
/// </summary>
public record CreateRoleGroupResult(
    Guid Id,
    string Code,
    string Name,
    RoleGroupType GroupType
);

