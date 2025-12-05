using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListRoleGroups;

/// <summary>
/// Query to list all role groups in the tenant.
/// </summary>
public record ListRoleGroupsQuery : IRequest<Result<List<RoleGroupDto>>>;
