using MediatR;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformRoleUsers;

/// <summary>
/// Query to list users assigned to a platform role.
/// </summary>
public record ListPlatformRoleUsersQuery(Guid RoleId) : IRequest<Result<List<RoleUserDto>>>;
