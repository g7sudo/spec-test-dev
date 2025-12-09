using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Rbac.Commands.CreateRoleGroup;

/// <summary>
/// Handler for creating a new role group.
/// </summary>
public class CreateRoleGroupCommandHandler
    : IRequestHandler<CreateRoleGroupCommand, Result<CreateRoleGroupResult>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateRoleGroupCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<CreateRoleGroupResult>> Handle(
        CreateRoleGroupCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<CreateRoleGroupResult>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Generate code from name if not provided
        var code = string.IsNullOrWhiteSpace(request.Code)
            ? GenerateCodeFromName(request.Name)
            : request.Code.ToUpperInvariant().Trim();

        // Check for duplicate code
        var existingRoleGroup = await _dbContext.RoleGroups
            .FirstOrDefaultAsync(rg => rg.Code == code && rg.IsActive, cancellationToken);

        if (existingRoleGroup != null)
        {
            return Result<CreateRoleGroupResult>.Failure(
                $"A role group with code '{code}' already exists.");
        }

        // Get the highest display order for new role placement
        var maxDisplayOrder = await _dbContext.RoleGroups
            .Where(rg => rg.IsActive)
            .MaxAsync(rg => (int?)rg.DisplayOrder, cancellationToken) ?? 0;

        // Create the role group (always non-system for user-created roles)
        var roleGroup = RoleGroup.Create(
            code: code,
            name: request.Name.Trim(),
            description: request.Description?.Trim(),
            groupType: request.GroupType,
            isSystem: false, // User-created roles are never system roles
            displayOrder: maxDisplayOrder + 1,
            createdBy: _currentUser.TenantUserId.Value);

        _dbContext.Add(roleGroup);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var result = new CreateRoleGroupResult(
            Id: roleGroup.Id,
            Code: roleGroup.Code,
            Name: roleGroup.Name,
            GroupType: roleGroup.GroupType);

        return Result<CreateRoleGroupResult>.Success(result);
    }

    /// <summary>
    /// Generates a code from the role name.
    /// Example: "Security Guard" -> "SECURITY_GUARD"
    /// </summary>
    private static string GenerateCodeFromName(string name)
    {
        return name
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "_")
            .Replace("-", "_");
    }
}

