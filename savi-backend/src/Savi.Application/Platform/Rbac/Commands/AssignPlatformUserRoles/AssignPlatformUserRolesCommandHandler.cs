using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Rbac.Commands.AssignPlatformUserRoles;

/// <summary>
/// Handler for assigning roles to a platform user.
/// </summary>
public class AssignPlatformUserRolesCommandHandler
    : IRequestHandler<AssignPlatformUserRolesCommand, Result<int>>
{
    private readonly IPlatformDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AssignPlatformUserRolesCommandHandler(
        IPlatformDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        AssignPlatformUserRolesCommand request,
        CancellationToken cancellationToken)
    {
        // Verify user exists
        var userExists = await _dbContext.PlatformUsers
            .AnyAsync(u => u.Id == request.UserId, cancellationToken);

        if (!userExists)
        {
            return Result<int>.Failure($"User with ID '{request.UserId}' not found.");
        }

        // Verify all role IDs are valid
        var validRoleIds = await _dbContext.PlatformRoles
            .Where(r => request.RoleIds.Contains(r.Id))
            .Select(r => r.Id)
            .ToListAsync(cancellationToken);

        var invalidIds = request.RoleIds.Except(validRoleIds).ToList();
        if (invalidIds.Any())
        {
            return Result<int>.Failure($"Invalid role IDs: {string.Join(", ", invalidIds)}");
        }

        // Get current user roles
        var currentUserRoles = await _dbContext.PlatformUserRoles
            .Where(ur => ur.PlatformUserId == request.UserId)
            .ToListAsync(cancellationToken);

        var currentRoleIds = currentUserRoles.Select(ur => ur.PlatformRoleId).ToList();

        // Determine roles to add and remove
        var rolesToAdd = request.RoleIds.Except(currentRoleIds).ToList();
        var rolesToRemove = currentUserRoles
            .Where(ur => !request.RoleIds.Contains(ur.PlatformRoleId))
            .ToList();

        // Remove old roles
        if (rolesToRemove.Any())
        {
            _dbContext.RemoveRange(rolesToRemove);
        }

        // Add new roles
        foreach (var roleId in rolesToAdd)
        {
            var userRole = PlatformUserRole.Create(
                request.UserId,
                roleId,
                _currentUser.UserId);
            _dbContext.Add(userRole);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var totalChanges = rolesToAdd.Count + rolesToRemove.Count;
        return Result<int>.Success(totalChanges);
    }
}
