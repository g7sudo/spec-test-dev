using Savi.Domain.Platform;

// Explicit alias to avoid conflict with Savi.Domain.Tenant namespace
using TenantEntity = Savi.Domain.Platform.Tenant;

namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Interface for the Platform database context.
/// 
/// Used in Application layer to avoid direct dependency on Infrastructure.
/// Implemented by PlatformDbContext in Infrastructure.
/// Uses IQueryable for abstraction.
/// </summary>
public interface IPlatformDbContext
{
    IQueryable<PlatformUser> PlatformUsers { get; }
    IQueryable<TenantEntity> Tenants { get; }
    IQueryable<Plan> Plans { get; }
    IQueryable<PlanFeature> PlanFeatures { get; }
    IQueryable<TenantPlan> TenantPlans { get; }
    IQueryable<Permission> Permissions { get; }
    IQueryable<PlatformRole> PlatformRoles { get; }
    IQueryable<PlatformRolePermission> PlatformRolePermissions { get; }
    IQueryable<PlatformUserRole> PlatformUserRoles { get; }
    IQueryable<PlatformRoleBypassPermission> PlatformRoleBypassPermissions { get; }
    IQueryable<UserTenantMembership> UserTenantMemberships { get; }
    IQueryable<PlatformAuditLog> PlatformAuditLogs { get; }

    /// <summary>
    /// Adds a new entity to the context.
    /// </summary>
    void Add<TEntity>(TEntity entity) where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

