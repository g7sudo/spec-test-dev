using Microsoft.EntityFrameworkCore;
using Savi.Domain.Tenant;

namespace Savi.Infrastructure.Persistence.TenantDb;

/// <summary>
/// DbContext for individual tenant databases.
/// 
/// Each tenant/community has its own database with this schema.
/// Connection string is resolved dynamically based on the current tenant context.
/// 
/// Contains:
/// - CommunityUser (tenant-level user linked to PlatformUser)
/// - RBAC (RoleGroup, RoleGroupPermission, CommunityUserRoleGroup)
/// - Other tenant entities will be added later (Party, Block, Unit, etc.)
/// </summary>
public class TenantDbContext : DbContext
{
    public TenantDbContext(DbContextOptions<TenantDbContext> options)
        : base(options)
    {
    }

    // Core entities
    public DbSet<CommunityUser> CommunityUsers => Set<CommunityUser>();

    // Tenant RBAC
    public DbSet<RoleGroup> RoleGroups => Set<RoleGroup>();
    public DbSet<RoleGroupPermission> RoleGroupPermissions => Set<RoleGroupPermission>();
    public DbSet<CommunityUserRoleGroup> CommunityUserRoleGroups => Set<CommunityUserRoleGroup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all tenant configurations from this assembly
        // Note: We only apply TenantDb configurations, not Platform ones
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(TenantDbContext).Assembly,
            type => type.Namespace?.Contains("Configurations.TenantDb") == true);
    }
}

