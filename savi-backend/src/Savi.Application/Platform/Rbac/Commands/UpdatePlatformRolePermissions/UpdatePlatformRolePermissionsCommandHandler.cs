using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Rbac.Commands.UpdatePlatformRolePermissions;

/// <summary>
/// Handler for updating platform role permissions.
/// </summary>
public class UpdatePlatformRolePermissionsCommandHandler
    : IRequestHandler<UpdatePlatformRolePermissionsCommand, Result<int>>
{
    private readonly IPlatformDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdatePlatformRolePermissionsCommandHandler(
        IPlatformDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        UpdatePlatformRolePermissionsCommand request,
        CancellationToken cancellationToken)
    {
        // Verify role exists
        var role = await _dbContext.PlatformRoles
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken);

        if (role == null)
        {
            return Result<int>.Failure($"Role with ID '{request.RoleId}' not found.");
        }

        // Verify all permission IDs are valid
        var validPermissionIds = await _dbContext.Permissions
            .Where(p => request.PermissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var invalidIds = request.PermissionIds.Except(validPermissionIds).ToList();
        if (invalidIds.Any())
        {
            return Result<int>.Failure($"Invalid permission IDs: {string.Join(", ", invalidIds)}");
        }

        // Get current role permissions
        var currentPermissions = await _dbContext.PlatformRolePermissions
            .Where(rp => rp.PlatformRoleId == request.RoleId)
            .ToListAsync(cancellationToken);

        var currentPermissionIds = currentPermissions.Select(rp => rp.PermissionId).ToList();

        // Determine permissions to add and remove
        var permissionsToAdd = request.PermissionIds.Except(currentPermissionIds).ToList();
        var permissionsToRemove = currentPermissions
            .Where(rp => !request.PermissionIds.Contains(rp.PermissionId))
            .ToList();

        // Remove old permissions
        if (permissionsToRemove.Any())
        {
            _dbContext.RemoveRange(permissionsToRemove);
        }

        // Add new permissions
        foreach (var permissionId in permissionsToAdd)
        {
            var rolePermission = PlatformRolePermission.Create(
                request.RoleId,
                permissionId,
                _currentUser.UserId);
            _dbContext.Add(rolePermission);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var totalChanges = permissionsToAdd.Count + permissionsToRemove.Count;
        return Result<int>.Success(totalChanges);
    }
}
