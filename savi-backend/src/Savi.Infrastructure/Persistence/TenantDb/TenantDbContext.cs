using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
    public DbSet<CommunityUserProfile> CommunityUserProfiles => Set<CommunityUserProfile>();
    IQueryable<CommunityUser> ITenantDbContext.CommunityUsers => CommunityUsers;
    IQueryable<CommunityUserProfile> ITenantDbContext.CommunityUserProfiles => CommunityUserProfiles;

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

    // Party Management
    public DbSet<Party> Parties => Set<Party>();
    public DbSet<PartyAddress> PartyAddresses => Set<PartyAddress>();
    public DbSet<PartyContact> PartyContacts => Set<PartyContact>();
    IQueryable<Party> ITenantDbContext.Parties => Parties;
    IQueryable<PartyAddress> ITenantDbContext.PartyAddresses => PartyAddresses;
    IQueryable<PartyContact> ITenantDbContext.PartyContacts => PartyContacts;

    // Ownership & Residency
    public DbSet<UnitOwnership> UnitOwnerships => Set<UnitOwnership>();
    IQueryable<UnitOwnership> ITenantDbContext.UnitOwnerships => UnitOwnerships;

    // Lease & Residents
    public DbSet<Lease> Leases => Set<Lease>();
    public DbSet<LeaseParty> LeaseParties => Set<LeaseParty>();
    public DbSet<ResidentInvite> ResidentInvites => Set<ResidentInvite>();
    IQueryable<Lease> ITenantDbContext.Leases => Leases;
    IQueryable<LeaseParty> ITenantDbContext.LeaseParties => LeaseParties;
    IQueryable<ResidentInvite> ITenantDbContext.ResidentInvites => ResidentInvites;

    // File Storage
    public DbSet<TempFileUpload> TempFileUploads => Set<TempFileUpload>();
    public DbSet<Document> Documents => Set<Document>();
    IQueryable<TempFileUpload> ITenantDbContext.TempFileUploads => TempFileUploads;
    IQueryable<Document> ITenantDbContext.Documents => Documents;

    // Amenities
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<AmenityBooking> AmenityBookings => Set<AmenityBooking>();
    public DbSet<AmenityBlackout> AmenityBlackouts => Set<AmenityBlackout>();
    IQueryable<Amenity> ITenantDbContext.Amenities => Amenities;
    IQueryable<AmenityBooking> ITenantDbContext.AmenityBookings => AmenityBookings;
    IQueryable<AmenityBlackout> ITenantDbContext.AmenityBlackouts => AmenityBlackouts;

    /// <summary>
    /// Explicit implementation of ITenantDbContext.Add to match interface signature (void return).
    /// </summary>
    void ITenantDbContext.Add<TEntity>(TEntity entity)
    {
        base.Add(entity);
    }

    /// <summary>
    /// Removes an entity from the context.
    /// </summary>
    void ITenantDbContext.Remove<TEntity>(TEntity entity)
    {
        base.Remove(entity);
    }

    /// <summary>
    /// Removes a range of entities from the context.
    /// </summary>
    void ITenantDbContext.RemoveRange<TEntity>(IEnumerable<TEntity> entities)
    {
        base.RemoveRange(entities);
    }

    /// <summary>
    /// Begins a new database transaction.
    /// </summary>
    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
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

