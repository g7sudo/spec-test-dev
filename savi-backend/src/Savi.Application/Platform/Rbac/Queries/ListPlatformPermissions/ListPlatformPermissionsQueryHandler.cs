using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformPermissions;

/// <summary>
/// Handler for listing all permissions.
/// </summary>
public class ListPlatformPermissionsQueryHandler
    : IRequestHandler<ListPlatformPermissionsQuery, Result<List<PermissionDto>>>
{
    private readonly IPlatformDbContext _dbContext;

    public ListPlatformPermissionsQueryHandler(IPlatformDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<PermissionDto>>> Handle(
        ListPlatformPermissionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Permissions.AsNoTracking();

        if (!string.IsNullOrEmpty(request.Scope))
        {
            query = query.Where(p => p.Module == request.Scope);
        }

        var permissions = await query
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Key)
            .Select(p => new PermissionDto(
                p.Id,
                p.Key,
                p.Module,
                p.Description ?? string.Empty,
                p.Key.StartsWith("PLATFORM_") ? "Platform" : "Tenant"
            ))
            .ToListAsync(cancellationToken);

        return Result<List<PermissionDto>>.Success(permissions);
    }
}
