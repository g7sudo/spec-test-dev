using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Rbac.Commands.AssignCommunityUserRoles;

/// <summary>
/// Handler for assigning role groups to a community user.
/// </summary>
public class AssignCommunityUserRolesCommandHandler
    : IRequestHandler<AssignCommunityUserRolesCommand, Result<int>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AssignCommunityUserRolesCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(
        AssignCommunityUserRolesCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<int>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Verify user exists
        var userExists = await _dbContext.CommunityUsers
            .AnyAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (!userExists)
        {
            return Result<int>.Failure($"User with ID '{request.UserId}' not found.");
        }

        // Verify all role group IDs are valid
        var roleGroupIds = request.RoleGroups.Select(rg => rg.RoleGroupId).Distinct().ToList();
        var validRoleGroupIds = await _dbContext.RoleGroups
            .Where(rg => roleGroupIds.Contains(rg.Id) && rg.IsActive)
            .Select(rg => rg.Id)
            .ToListAsync(cancellationToken);

        var invalidIds = roleGroupIds.Except(validRoleGroupIds).ToList();
        if (invalidIds.Any())
        {
            return Result<int>.Failure($"Invalid role group IDs: {string.Join(", ", invalidIds)}");
        }

        // Validate exactly one primary role if roles are being assigned
        if (request.RoleGroups.Any())
        {
            var primaryCount = request.RoleGroups.Count(rg => rg.IsPrimary);
            if (primaryCount != 1)
            {
                return Result<int>.Failure(
                    "Exactly one role group must be marked as primary.");
            }
        }

        // Get current user role groups
        var currentUserRoleGroups = await _dbContext.CommunityUserRoleGroups
            .Where(curg => curg.CommunityUserId == request.UserId)
            .ToListAsync(cancellationToken);

        var currentRoleGroupIds = currentUserRoleGroups.Select(curg => curg.RoleGroupId).ToList();

        // Determine role groups to add and remove
        var roleGroupsToAdd = request.RoleGroups
            .Where(rg => !currentRoleGroupIds.Contains(rg.RoleGroupId))
            .ToList();

        var roleGroupsToRemove = currentUserRoleGroups
            .Where(curg => !roleGroupIds.Contains(curg.RoleGroupId))
            .ToList();

        var roleGroupsToUpdate = currentUserRoleGroups
            .Where(curg => roleGroupIds.Contains(curg.RoleGroupId))
            .ToList();

        // Remove old role groups
        if (roleGroupsToRemove.Any())
        {
            _dbContext.RemoveRange(roleGroupsToRemove);
        }

        // Update existing role groups (for IsPrimary changes)
        foreach (var existing in roleGroupsToUpdate)
        {
            var newData = request.RoleGroups.First(rg => rg.RoleGroupId == existing.RoleGroupId);
            if (existing.IsPrimary != newData.IsPrimary)
            {
                existing.SetPrimary(newData.IsPrimary, _currentUser.TenantUserId.Value);
            }
        }

        // Add new role groups
        foreach (var roleGroup in roleGroupsToAdd)
        {
            var userRoleGroup = CommunityUserRoleGroup.Create(
                request.UserId,
                roleGroup.RoleGroupId,
                roleGroup.IsPrimary,
                null, // ValidFrom
                null, // ValidTo
                _currentUser.TenantUserId.Value);
            _dbContext.Add(userRoleGroup);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var totalChanges = roleGroupsToAdd.Count + roleGroupsToRemove.Count +
            roleGroupsToUpdate.Count(u => request.RoleGroups.Any(rg => rg.RoleGroupId == u.RoleGroupId && rg.IsPrimary != u.IsPrimary));
        return Result<int>.Success(totalChanges);
    }
}
