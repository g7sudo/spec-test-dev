using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.GetRoleGroupDetail;

/// <summary>
/// Query to get role group detail with all permissions and their enabled state.
/// </summary>
public record GetRoleGroupDetailQuery(Guid RoleGroupId) : IRequest<Result<RoleGroupDetailDto>>;
