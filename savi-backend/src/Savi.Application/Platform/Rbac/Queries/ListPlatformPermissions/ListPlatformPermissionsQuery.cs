using MediatR;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformPermissions;

/// <summary>
/// Query to list all permissions.
/// </summary>
public record ListPlatformPermissionsQuery(
    string? Scope = null
) : IRequest<Result<List<PermissionDto>>>;
