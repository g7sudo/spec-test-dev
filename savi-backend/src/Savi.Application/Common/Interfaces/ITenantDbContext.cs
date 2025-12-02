using Savi.Domain.Tenant;

namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Interface for the Tenant database context.
/// 
/// Used in Application layer to avoid direct dependency on Infrastructure.
/// Implemented by TenantDbContext in Infrastructure.
/// Uses IQueryable for abstraction.
/// </summary>
public interface ITenantDbContext
{
    // Core entities
    IQueryable<CommunityUser> CommunityUsers { get; }

    // Tenant RBAC
    IQueryable<RoleGroup> RoleGroups { get; }
    IQueryable<RoleGroupPermission> RoleGroupPermissions { get; }
    IQueryable<CommunityUserRoleGroup> CommunityUserRoleGroups { get; }

    // Community Structure
    IQueryable<Block> Blocks { get; }
    IQueryable<Floor> Floors { get; }
    IQueryable<UnitType> UnitTypes { get; }
    IQueryable<Unit> Units { get; }
    IQueryable<ParkingSlot> ParkingSlots { get; }

    /// <summary>
    /// Adds a new entity to the context.
    /// </summary>
    void Add<TEntity>(TEntity entity) where TEntity : class;

    /// <summary>
    /// Saves all changes made in this context to the database.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

