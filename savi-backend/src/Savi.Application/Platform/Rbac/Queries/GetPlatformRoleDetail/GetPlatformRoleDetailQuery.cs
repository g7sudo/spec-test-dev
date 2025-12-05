using MediatR;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.GetPlatformRoleDetail;

/// <summary>
/// Query to get platform role detail with all permissions and their enabled state.
/// </summary>
public record GetPlatformRoleDetailQuery(Guid RoleId) : IRequest<Result<PlatformRoleDetailDto>>;
