namespace Savi.Application.Common.Authorization;

/// <summary>
/// Service for checking resource ownership and access levels based on user permissions.
/// Determines if a user can view/create/manage resources at full, unit, or own level.
/// </summary>
public interface IResourceOwnershipChecker
{
    /// <summary>
    /// Gets the current user's access level for amenity bookings.
    /// </summary>
    AmenityBookingAccess GetAmenityBookingAccess();

    /// <summary>
    /// Gets the current user's access level for visitor passes.
    /// </summary>
    VisitorPassAccess GetVisitorPassAccess();

    /// <summary>
    /// Gets the current user's access level for maintenance requests.
    /// </summary>
    MaintenanceRequestAccess GetMaintenanceRequestAccess();

    /// <summary>
    /// Gets all unit IDs that the current user belongs to (via lease or ownership).
    /// </summary>
    Task<IReadOnlyList<Guid>> GetUserUnitIdsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Access flags for amenity booking operations.
/// Hierarchy: Full → Unit → Own
/// </summary>
public record AmenityBookingAccess
{
    /// <summary>
    /// User can view all bookings (has TENANT_AMENITY_VIEW or TENANT_AMENITY_MANAGE).
    /// </summary>
    public bool CanViewAll { get; init; }

    /// <summary>
    /// User can view bookings for their units (has TENANT_AMENITY_BOOKING_VIEW_UNIT).
    /// </summary>
    public bool CanViewUnit { get; init; }

    /// <summary>
    /// User can view only their own bookings (has TENANT_AMENITY_BOOKING_VIEW_OWN).
    /// </summary>
    public bool CanViewOwn { get; init; }

    /// <summary>
    /// User can create bookings for anyone (has TENANT_AMENITY_BOOK or TENANT_AMENITY_MANAGE).
    /// </summary>
    public bool CanCreateForAll { get; init; }

    /// <summary>
    /// User can create bookings for their unit members (has TENANT_AMENITY_BOOKING_CREATE_UNIT).
    /// </summary>
    public bool CanCreateForUnit { get; init; }

    /// <summary>
    /// User can create bookings only for themselves (has TENANT_AMENITY_BOOKING_CREATE_OWN).
    /// </summary>
    public bool CanCreateForSelf { get; init; }

    /// <summary>
    /// User can manage all bookings (has TENANT_AMENITY_BOOK or TENANT_AMENITY_MANAGE).
    /// </summary>
    public bool CanManageAll { get; init; }

    /// <summary>
    /// User can manage bookings for their unit members (has TENANT_AMENITY_BOOKING_MANAGE_UNIT).
    /// </summary>
    public bool CanManageUnit { get; init; }

    /// <summary>
    /// User can manage only their own bookings (has TENANT_AMENITY_BOOKING_MANAGE_OWN).
    /// </summary>
    public bool CanManageOwn { get; init; }

    /// <summary>
    /// The current user's tenant user ID (CommunityUser.Id).
    /// </summary>
    public Guid? CurrentTenantUserId { get; init; }
}

/// <summary>
/// Access flags for visitor pass operations.
/// Hierarchy: Full → Unit → Own
/// </summary>
public record VisitorPassAccess
{
    /// <summary>
    /// User can view all visitor passes.
    /// </summary>
    public bool CanViewAll { get; init; }

    /// <summary>
    /// User can view visitor passes for their units.
    /// </summary>
    public bool CanViewUnit { get; init; }

    /// <summary>
    /// User can view only their own visitor passes.
    /// </summary>
    public bool CanViewOwn { get; init; }

    /// <summary>
    /// User can create visitor passes for anyone.
    /// </summary>
    public bool CanCreateForAll { get; init; }

    /// <summary>
    /// User can create visitor passes for their unit.
    /// </summary>
    public bool CanCreateForUnit { get; init; }

    /// <summary>
    /// User can create visitor passes only for themselves.
    /// </summary>
    public bool CanCreateForSelf { get; init; }

    /// <summary>
    /// User can manage all visitor passes.
    /// </summary>
    public bool CanManageAll { get; init; }

    /// <summary>
    /// User can manage visitor passes for their unit.
    /// </summary>
    public bool CanManageUnit { get; init; }

    /// <summary>
    /// User can manage only their own visitor passes.
    /// </summary>
    public bool CanManageOwn { get; init; }

    /// <summary>
    /// The current user's tenant user ID (CommunityUser.Id).
    /// </summary>
    public Guid? CurrentTenantUserId { get; init; }
}

/// <summary>
/// Access flags for maintenance request operations.
/// Hierarchy: Full → Unit → Own
/// </summary>
public record MaintenanceRequestAccess
{
    /// <summary>
    /// User can view all maintenance requests.
    /// </summary>
    public bool CanViewAll { get; init; }

    /// <summary>
    /// User can view maintenance requests for their units.
    /// </summary>
    public bool CanViewUnit { get; init; }

    /// <summary>
    /// User can view only their own maintenance requests.
    /// </summary>
    public bool CanViewOwn { get; init; }

    /// <summary>
    /// User can create maintenance requests for any unit.
    /// </summary>
    public bool CanCreateForAll { get; init; }

    /// <summary>
    /// User can create maintenance requests for their unit.
    /// </summary>
    public bool CanCreateForUnit { get; init; }

    /// <summary>
    /// User can create maintenance requests only for themselves.
    /// </summary>
    public bool CanCreateForSelf { get; init; }

    /// <summary>
    /// The current user's tenant user ID (CommunityUser.Id).
    /// </summary>
    public Guid? CurrentTenantUserId { get; init; }
}
