using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
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
public class TenantDbContext : DbContext, ITenantDbContext
{
    public TenantDbContext(DbContextOptions<TenantDbContext> options)
        : base(options)
    {
    }

    // Core entities
    public DbSet<CommunityUser> CommunityUsers => Set<CommunityUser>();
    IQueryable<CommunityUser> ITenantDbContext.CommunityUsers => CommunityUsers;

    // Tenant RBAC
    public DbSet<RoleGroup> RoleGroups => Set<RoleGroup>();
    public DbSet<RoleGroupPermission> RoleGroupPermissions => Set<RoleGroupPermission>();
    public DbSet<CommunityUserRoleGroup> CommunityUserRoleGroups => Set<CommunityUserRoleGroup>();
    IQueryable<RoleGroup> ITenantDbContext.RoleGroups => RoleGroups;
    IQueryable<RoleGroupPermission> ITenantDbContext.RoleGroupPermissions => RoleGroupPermissions;
    IQueryable<CommunityUserRoleGroup> ITenantDbContext.CommunityUserRoleGroups => CommunityUserRoleGroups;

    // Community Structure
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Floor> Floors => Set<Floor>();
    public DbSet<UnitType> UnitTypes => Set<UnitType>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();
    IQueryable<Block> ITenantDbContext.Blocks => Blocks;
    IQueryable<Floor> ITenantDbContext.Floors => Floors;
    IQueryable<UnitType> ITenantDbContext.UnitTypes => UnitTypes;
    IQueryable<Unit> ITenantDbContext.Units => Units;
    IQueryable<ParkingSlot> ITenantDbContext.ParkingSlots => ParkingSlots;

    /// <summary>
    /// Explicit implementation of ITenantDbContext.Add to match interface signature (void return).
    /// </summary>
    void ITenantDbContext.Add<TEntity>(TEntity entity)
    {
        base.Add(entity);
    }

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

