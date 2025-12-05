using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Rbac.Dtos;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Rbac.Queries.GetRoleGroupDetail;

/// <summary>
/// Handler for getting role group detail with permissions.
/// </summary>
public class GetRoleGroupDetailQueryHandler
    : IRequestHandler<GetRoleGroupDetailQuery, Result<RoleGroupDetailDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetRoleGroupDetailQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<RoleGroupDetailDto>> Handle(
        GetRoleGroupDetailQuery request,
        CancellationToken cancellationToken)
    {
        var roleGroup = await _dbContext.RoleGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(rg => rg.Id == request.RoleGroupId && rg.IsActive, cancellationToken);

        if (roleGroup == null)
        {
            return Result<RoleGroupDetailDto>.Failure($"Role group with ID '{request.RoleGroupId}' not found.");
        }

        // Get assigned permission keys for this role group
        var assignedPermissionKeys = await _dbContext.RoleGroupPermissions
            .AsNoTracking()
            .Where(rgp => rgp.RoleGroupId == request.RoleGroupId)
            .Select(rgp => rgp.PermissionKey)
            .ToListAsync(cancellationToken);

        // Get all tenant permissions with enabled state
        var permissions = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Key)
            .Select(p => new RoleGroupPermissionDto(
                p.Key,
                p.Module,
                p.Description,
                assignedPermissionKeys.Contains(p.Key)
            ))
            .ToList();

        var result = new RoleGroupDetailDto(
            roleGroup.Id,
            roleGroup.Code,
            roleGroup.Name,
            roleGroup.Description,
            roleGroup.GroupType,
            roleGroup.IsSystem,
            roleGroup.DisplayOrder,
            permissions
        );

        return Result<RoleGroupDetailDto>.Success(result);
    }
}
