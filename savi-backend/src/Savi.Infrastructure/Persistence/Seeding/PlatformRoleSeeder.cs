using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;
using Savi.SharedKernel.Authorization;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeder for default PlatformRoles and their permissions.
/// Creates PLATFORM_ADMIN role with all platform permissions.
/// </summary>
public class PlatformRoleSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ILogger<PlatformRoleSeeder> _logger;

    // Default platform role codes
    public const string PlatformAdminCode = "PLATFORM_ADMIN";
    public const string PlatformSupportCode = "PLATFORM_SUPPORT";

    public PlatformRoleSeeder(
        PlatformDbContext dbContext,
        ILogger<PlatformRoleSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Seeds default platform roles and their permission assignments.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting platform role seeding...");

        // Seed PLATFORM_ADMIN role
        await SeedPlatformAdminAsync(cancellationToken);

        // Seed PLATFORM_SUPPORT role (read-only access)
        await SeedPlatformSupportAsync(cancellationToken);
    }

    /// <summary>
    /// Seeds the PLATFORM_ADMIN role with all permissions (platform and tenant).
    /// </summary>
    private async Task SeedPlatformAdminAsync(CancellationToken cancellationToken)
    {
        var existingRole = await _dbContext.PlatformRolesSet
            .FirstOrDefaultAsync(r => r.Code == PlatformAdminCode, cancellationToken);

        PlatformRole adminRole;
        if (existingRole == null)
        {
            adminRole = PlatformRole.Create(
                code: PlatformAdminCode,
                name: "Platform Administrator",
                description: "Full access to all platform and tenant operations",
                isSystem: true);

            _dbContext.PlatformRolesSet.Add(adminRole);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Created PLATFORM_ADMIN role");
        }
        else
        {
            adminRole = existingRole;
            _logger.LogDebug("PLATFORM_ADMIN role already exists");
        }

        // Assign ALL permissions to admin role (both platform and tenant scopes)
        await AssignAllPermissionsToRoleAsync(adminRole, cancellationToken);
    }

    /// <summary>
    /// Seeds the PLATFORM_SUPPORT role with read-only platform permissions.
    /// </summary>
    private async Task SeedPlatformSupportAsync(CancellationToken cancellationToken)
    {
        var existingRole = await _dbContext.PlatformRolesSet
            .FirstOrDefaultAsync(r => r.Code == PlatformSupportCode, cancellationToken);

        PlatformRole supportRole;
        if (existingRole == null)
        {
            supportRole = PlatformRole.Create(
                code: PlatformSupportCode,
                name: "Platform Support",
                description: "Read-only access to platform data for support purposes",
                isSystem: true);

            _dbContext.PlatformRolesSet.Add(supportRole);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Created PLATFORM_SUPPORT role");
        }
        else
        {
            supportRole = existingRole;
            _logger.LogDebug("PLATFORM_SUPPORT role already exists");
        }

        // Assign only VIEW permissions to support role
        var viewPermissionKeys = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Platform && p.Action == "VIEW")
            .Select(p => p.Key)
            .ToList();

        await AssignSpecificPermissionsToRoleAsync(supportRole, viewPermissionKeys, cancellationToken);
    }

    /// <summary>
    /// Assigns all permissions of a given scope to a role.
    /// </summary>
    private async Task AssignPlatformPermissionsToRoleAsync(
        PlatformRole role,
        PermissionScope scope,
        CancellationToken cancellationToken)
    {
        var permissionKeys = Permissions.All()
            .Where(p => p.Scope == scope)
            .Select(p => p.Key)
            .ToList();

        await AssignSpecificPermissionsToRoleAsync(role, permissionKeys, cancellationToken);
    }

    /// <summary>
    /// Assigns ALL permissions (regardless of scope) to a role.
    /// Used for PLATFORM_ADMIN to grant full access to everything.
    /// </summary>
    private async Task AssignAllPermissionsToRoleAsync(
        PlatformRole role,
        CancellationToken cancellationToken)
    {
        var permissionKeys = Permissions.All()
            .Select(p => p.Key)
            .ToList();

        await AssignSpecificPermissionsToRoleAsync(role, permissionKeys, cancellationToken);
    }

    /// <summary>
    /// Assigns specific permissions (by key) to a role.
    /// </summary>
    private async Task AssignSpecificPermissionsToRoleAsync(
        PlatformRole role,
        List<string> permissionKeys,
        CancellationToken cancellationToken)
    {
        var dbPermissions = await _dbContext.PermissionsSet
            .Where(p => permissionKeys.Contains(p.Key))
            .ToListAsync(cancellationToken);

        var existingRolePermissions = await _dbContext.PlatformRolePermissionsSet
            .Where(rp => rp.PlatformRoleId == role.Id)
            .Select(rp => rp.PermissionId)
            .ToListAsync(cancellationToken);

        var newRolePermissions = dbPermissions
            .Where(p => !existingRolePermissions.Contains(p.Id))
            .Select(p => PlatformRolePermission.Create(
                platformRoleId: role.Id,
                permissionId: p.Id))
            .ToList();

        if (newRolePermissions.Count > 0)
        {
            _dbContext.PlatformRolePermissionsSet.AddRange(newRolePermissions);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                "Assigned {PermCount} permissions to {RoleCode} role",
                newRolePermissions.Count,
                role.Code);
        }
    }
}
