using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListTenantPermissions;

/// <summary>
/// Handler for listing all tenant-scoped permissions.
/// Uses the static Permissions catalog.
/// </summary>
public class ListTenantPermissionsQueryHandler
    : IRequestHandler<ListTenantPermissionsQuery, Result<List<TenantPermissionDto>>>
{
    public Task<Result<List<TenantPermissionDto>>> Handle(
        ListTenantPermissionsQuery request,
        CancellationToken cancellationToken)
    {
        var permissions = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Key)
            .Select(p => new TenantPermissionDto(
                p.Key,
                p.Module,
                p.Description
            ))
            .ToList();

        return Task.FromResult(Result<List<TenantPermissionDto>>.Success(permissions));
    }
}
