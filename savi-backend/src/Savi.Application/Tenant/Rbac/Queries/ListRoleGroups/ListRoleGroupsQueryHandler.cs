using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.ListRoleGroups;

/// <summary>
/// Handler for listing all role groups.
/// </summary>
public class ListRoleGroupsQueryHandler
    : IRequestHandler<ListRoleGroupsQuery, Result<List<RoleGroupDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListRoleGroupsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<RoleGroupDto>>> Handle(
        ListRoleGroupsQuery request,
        CancellationToken cancellationToken)
    {
        // Get role groups first
        var roleGroups = await _dbContext.RoleGroups
            .AsNoTracking()
            .Where(rg => rg.IsActive)
            .OrderBy(rg => rg.DisplayOrder)
            .ThenBy(rg => rg.Name)
            .ToListAsync(cancellationToken);

        var roleGroupIds = roleGroups.Select(rg => rg.Id).ToList();

        // Get permission counts
        var permissionCounts = await _dbContext.RoleGroupPermissions
            .AsNoTracking()
            .Where(rgp => roleGroupIds.Contains(rgp.RoleGroupId))
            .GroupBy(rgp => rgp.RoleGroupId)
            .Select(g => new { RoleGroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleGroupId, x => x.Count, cancellationToken);

        // Get user counts
        var userCounts = await _dbContext.CommunityUserRoleGroups
            .AsNoTracking()
            .Where(curg => roleGroupIds.Contains(curg.RoleGroupId))
            .GroupBy(curg => curg.RoleGroupId)
            .Select(g => new { RoleGroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleGroupId, x => x.Count, cancellationToken);

        // Map to DTOs
        var roleGroupDtos = roleGroups.Select(rg => new RoleGroupDto(
            rg.Id,
            rg.Code,
            rg.Name,
            rg.Description,
            rg.GroupType,
            rg.IsSystem,
            rg.DisplayOrder,
            permissionCounts.GetValueOrDefault(rg.Id, 0),
            userCounts.GetValueOrDefault(rg.Id, 0)
        )).ToList();

        return Result<List<RoleGroupDto>>.Success(roleGroupDtos);
    }
}
