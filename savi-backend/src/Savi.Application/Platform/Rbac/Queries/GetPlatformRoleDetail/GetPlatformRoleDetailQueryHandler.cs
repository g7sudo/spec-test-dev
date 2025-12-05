using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Rbac.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Rbac.Queries.GetPlatformRoleDetail;

/// <summary>
/// Handler for getting platform role detail with permissions.
/// </summary>
public class GetPlatformRoleDetailQueryHandler
    : IRequestHandler<GetPlatformRoleDetailQuery, Result<PlatformRoleDetailDto>>
{
    private readonly IPlatformDbContext _dbContext;

    public GetPlatformRoleDetailQueryHandler(IPlatformDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PlatformRoleDetailDto>> Handle(
        GetPlatformRoleDetailQuery request,
        CancellationToken cancellationToken)
    {
        var role = await _dbContext.PlatformRoles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken);

        if (role == null)
        {
            return Result<PlatformRoleDetailDto>.Failure($"Role with ID '{request.RoleId}' not found.");
        }

        // Get all role's assigned permission IDs
        var assignedPermissionIds = await _dbContext.PlatformRolePermissions
            .AsNoTracking()
            .Where(rp => rp.PlatformRoleId == request.RoleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync(cancellationToken);

        // Get all permissions with enabled state
        var permissions = await _dbContext.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Key)
            .Select(p => new RolePermissionDto(
                p.Id,
                p.Key,
                p.Module,
                p.Description ?? string.Empty,
                assignedPermissionIds.Contains(p.Id)
            ))
            .ToListAsync(cancellationToken);

        var result = new PlatformRoleDetailDto(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            role.IsSystem,
            permissions
        );

        return Result<PlatformRoleDetailDto>.Success(result);
    }
}
