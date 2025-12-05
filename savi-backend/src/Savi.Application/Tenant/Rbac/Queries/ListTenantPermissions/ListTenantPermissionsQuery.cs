using MediatR;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListTenantPermissions;

/// <summary>
/// Query to list all tenant-scoped permissions.
/// </summary>
public record ListTenantPermissionsQuery : IRequest<Result<List<TenantPermissionDto>>>;
