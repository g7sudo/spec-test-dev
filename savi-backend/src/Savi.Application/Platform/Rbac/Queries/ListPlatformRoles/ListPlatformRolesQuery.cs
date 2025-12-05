using MediatR;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformRoles;

/// <summary>
/// Query to list all platform roles.
/// </summary>
public record ListPlatformRolesQuery : IRequest<Result<List<PlatformRoleDto>>>;
