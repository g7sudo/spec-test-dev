using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListRoleGroupUsers;

/// <summary>
/// Query to list users assigned to a role group.
/// </summary>
public record ListRoleGroupUsersQuery(Guid RoleGroupId) : IRequest<Result<List<RoleGroupUserDto>>>;
