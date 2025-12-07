using Microsoft.EntityFrameworkCore.Storage;
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
    IQueryable<CommunityUserProfile> CommunityUserProfiles { get; }

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

    // Party Management
    IQueryable<Party> Parties { get; }
    IQueryable<PartyAddress> PartyAddresses { get; }
    IQueryable<PartyContact> PartyContacts { get; }

    // Ownership & Residency
    IQueryable<UnitOwnership> UnitOwnerships { get; }

    // Lease & Residents
    IQueryable<Lease> Leases { get; }
    IQueryable<LeaseParty> LeaseParties { get; }
    IQueryable<ResidentInvite> ResidentInvites { get; }

    // File Storage
    IQueryable<TempFileUpload> TempFileUploads { get; }
    IQueryable<Document> Documents { get; }

    // Amenities
    IQueryable<Amenity> Amenities { get; }
    IQueryable<AmenityBooking> AmenityBookings { get; }
    IQueryable<AmenityBlackout> AmenityBlackouts { get; }

    // Maintenance
    IQueryable<MaintenanceCategory> MaintenanceCategories { get; }
    IQueryable<MaintenanceRequest> MaintenanceRequests { get; }
    IQueryable<MaintenanceRequestDetail> MaintenanceRequestDetails { get; }
    IQueryable<MaintenanceApproval> MaintenanceApprovals { get; }
    IQueryable<MaintenanceComment> MaintenanceComments { get; }

    // Visitors
    IQueryable<VisitorPass> VisitorPasses { get; }

    // Announcements
    IQueryable<Announcement> Announcements { get; }
    IQueryable<AnnouncementAudience> AnnouncementAudiences { get; }
    IQueryable<AnnouncementLike> AnnouncementLikes { get; }
    IQueryable<AnnouncementComment> AnnouncementComments { get; }
    IQueryable<AnnouncementRead> AnnouncementReads { get; }

    // User Notifications
    IQueryable<UserNotification> UserNotifications { get; }

    /// <summary>
    /// Adds a new entity to the context.
    /// </summary>
    void Add<TEntity>(TEntity entity) where TEntity : class;

    /// <summary>
    /// Removes an entity from the context.
    /// </summary>
    void Remove<TEntity>(TEntity entity) where TEntity : class;

    /// <summary>
    /// Removes a range of entities from the context.
    /// </summary>
    void RemoveRange<TEntity>(IEnumerable<TEntity> entities) where TEntity : class;

    /// <summary>
    /// Saves all changes made in this context to the database.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a new database transaction.
    /// </summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

