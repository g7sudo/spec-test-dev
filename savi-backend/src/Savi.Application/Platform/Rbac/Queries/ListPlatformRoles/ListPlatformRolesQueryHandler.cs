using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.ListPlatformRoles;

/// <summary>
/// Handler for listing all platform roles.
/// </summary>
public class ListPlatformRolesQueryHandler
    : IRequestHandler<ListPlatformRolesQuery, Result<List<PlatformRoleDto>>>
{
    private readonly IPlatformDbContext _dbContext;

    public ListPlatformRolesQueryHandler(IPlatformDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<PlatformRoleDto>>> Handle(
        ListPlatformRolesQuery request,
        CancellationToken cancellationToken)
    {
        // Get roles first
        var roles = await _dbContext.PlatformRoles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);

        var roleIds = roles.Select(r => r.Id).ToList();

        // Get permission counts
        var permissionCounts = await _dbContext.PlatformRolePermissions
            .AsNoTracking()
            .Where(rp => roleIds.Contains(rp.PlatformRoleId))
            .GroupBy(rp => rp.PlatformRoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count, cancellationToken);

        // Get user counts
        var userCounts = await _dbContext.PlatformUserRoles
            .AsNoTracking()
            .Where(ur => roleIds.Contains(ur.PlatformRoleId))
            .GroupBy(ur => ur.PlatformRoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count, cancellationToken);

        // Map to DTOs
        var roleDtos = roles.Select(r => new PlatformRoleDto(
            r.Id,
            r.Code,
            r.Name,
            r.Description,
            r.IsSystem,
            permissionCounts.GetValueOrDefault(r.Id, 0),
            userCounts.GetValueOrDefault(r.Id, 0)
        )).ToList();

        return Result<List<PlatformRoleDto>>.Success(roleDtos);
    }
}
