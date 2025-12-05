using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;

// Explicit alias to avoid conflict with Savi.Domain.Tenant namespace
using TenantEntity = Savi.Domain.Platform.Tenant;

namespace Savi.Infrastructure.Persistence.Platform;

/// <summary>
/// DbContext for the Platform database (global/shared data).
/// 
/// Contains:
/// - PlatformUsers (global identity)
/// - Tenants (communities)
/// - Plans and PlanFeatures
/// - Permissions catalog
/// - Platform RBAC (PlatformRoles, PlatformRolePermissions, PlatformUserRoles, PlatformRoleBypassPermissions)
/// - UserTenantMemberships
/// </summary>
public class PlatformDbContext : DbContext, IPlatformDbContext
{
    public PlatformDbContext(DbContextOptions<PlatformDbContext> options)
        : base(options)
    {
    }

    // Core entities (DbSet as IQueryable for interface)
    public DbSet<PlatformUser> PlatformUsersSet => Set<PlatformUser>();
    public DbSet<TenantEntity> TenantsSet => Set<TenantEntity>();
    IQueryable<PlatformUser> IPlatformDbContext.PlatformUsers => PlatformUsersSet;
    IQueryable<TenantEntity> IPlatformDbContext.Tenants => TenantsSet;

    // Plans
    public DbSet<Plan> PlansSet => Set<Plan>();
    public DbSet<PlanFeature> PlanFeaturesSet => Set<PlanFeature>();
    public DbSet<TenantPlan> TenantPlansSet => Set<TenantPlan>();
    IQueryable<Plan> IPlatformDbContext.Plans => PlansSet;
    IQueryable<PlanFeature> IPlatformDbContext.PlanFeatures => PlanFeaturesSet;
    IQueryable<TenantPlan> IPlatformDbContext.TenantPlans => TenantPlansSet;

    // Permissions catalog
    public DbSet<Permission> PermissionsSet => Set<Permission>();
    IQueryable<Permission> IPlatformDbContext.Permissions => PermissionsSet;

    // Platform RBAC
    public DbSet<PlatformRole> PlatformRolesSet => Set<PlatformRole>();
    public DbSet<PlatformRolePermission> PlatformRolePermissionsSet => Set<PlatformRolePermission>();
    public DbSet<PlatformUserRole> PlatformUserRolesSet => Set<PlatformUserRole>();
    public DbSet<PlatformRoleBypassPermission> PlatformRoleBypassPermissionsSet => Set<PlatformRoleBypassPermission>();
    IQueryable<PlatformRole> IPlatformDbContext.PlatformRoles => PlatformRolesSet;
    IQueryable<PlatformRolePermission> IPlatformDbContext.PlatformRolePermissions => PlatformRolePermissionsSet;
    IQueryable<PlatformUserRole> IPlatformDbContext.PlatformUserRoles => PlatformUserRolesSet;
    IQueryable<PlatformRoleBypassPermission> IPlatformDbContext.PlatformRoleBypassPermissions => PlatformRoleBypassPermissionsSet;

    // Membership
    public DbSet<UserTenantMembership> UserTenantMembershipsSet => Set<UserTenantMembership>();
    IQueryable<UserTenantMembership> IPlatformDbContext.UserTenantMemberships => UserTenantMembershipsSet;

    // Audit logging
    public DbSet<PlatformAuditLog> PlatformAuditLogsSet => Set<PlatformAuditLog>();
    IQueryable<PlatformAuditLog> IPlatformDbContext.PlatformAuditLogs => PlatformAuditLogsSet;

    /// <summary>
    /// Adds a new entity to the context (explicit interface implementation).
    /// </summary>
    void IPlatformDbContext.Add<TEntity>(TEntity entity) => base.Add(entity);

    /// <summary>
    /// Removes an entity from the context (explicit interface implementation).
    /// </summary>
    void IPlatformDbContext.Remove<TEntity>(TEntity entity) => base.Remove(entity);

    /// <summary>
    /// Removes a range of entities from the context (explicit interface implementation).
    /// </summary>
    void IPlatformDbContext.RemoveRange<TEntity>(IEnumerable<TEntity> entities) => base.RemoveRange(entities);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply only platform-specific configurations from this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(PlatformDbContext).Assembly,
            type => type.Namespace?.Contains("Configurations.Platform") == true);
    }
}

