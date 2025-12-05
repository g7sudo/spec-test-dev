using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Rbac.Commands.UpdateRoleGroupPermissions;

/// <summary>
/// Handler for updating role group permissions.
/// </summary>
public class UpdateRoleGroupPermissionsCommandHandler
    : IRequestHandler<UpdateRoleGroupPermissionsCommand, Result<int>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateRoleGroupPermissionsCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        UpdateRoleGroupPermissionsCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<int>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify role group exists
        var roleGroup = await _dbContext.RoleGroups
            .FirstOrDefaultAsync(rg => rg.Id == request.RoleGroupId && rg.IsActive, cancellationToken);

        if (roleGroup == null)
        {
            return Result<int>.Failure($"Role group with ID '{request.RoleGroupId}' not found.");
        }

        // Validate all permission keys are valid tenant permissions
        var validPermissionKeys = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .Select(p => p.Key)
            .ToHashSet();

        var invalidKeys = request.PermissionKeys.Where(k => !validPermissionKeys.Contains(k)).ToList();
        if (invalidKeys.Any())
        {
            return Result<int>.Failure($"Invalid permission keys: {string.Join(", ", invalidKeys)}");
        }

        // Get current role group permissions
        var currentPermissions = await _dbContext.RoleGroupPermissions
            .Where(rgp => rgp.RoleGroupId == request.RoleGroupId)
            .ToListAsync(cancellationToken);

        var currentPermissionKeys = currentPermissions.Select(rgp => rgp.PermissionKey).ToList();

        // Determine permissions to add and remove
        var permissionsToAdd = request.PermissionKeys.Except(currentPermissionKeys).ToList();
        var permissionsToRemove = currentPermissions
            .Where(rgp => !request.PermissionKeys.Contains(rgp.PermissionKey))
            .ToList();

        // Remove old permissions
        if (permissionsToRemove.Any())
        {
            _dbContext.RemoveRange(permissionsToRemove);
        }

        // Add new permissions
        foreach (var permissionKey in permissionsToAdd)
        {
            var roleGroupPermission = RoleGroupPermission.Create(
                request.RoleGroupId,
                permissionKey,
                _currentUser.TenantUserId.Value);
            _dbContext.Add(roleGroupPermission);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var totalChanges = permissionsToAdd.Count + permissionsToRemove.Count;
        return Result<int>.Success(totalChanges);
    }
}
