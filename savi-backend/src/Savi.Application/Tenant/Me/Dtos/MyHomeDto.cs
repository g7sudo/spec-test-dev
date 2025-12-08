using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Me.Dtos;

/// <summary>
/// DTO for the current user's home information.
/// Aggregates units, leases, and co-residents.
/// </summary>
public record MyHomeDto
{
    /// <summary>
    /// List of units the current user is associated with through active leases.
    /// </summary>
    public List<MyUnitDto> Units { get; init; } = new();
}

/// <summary>
/// DTO for a unit the current user is associated with.
/// </summary>
public record MyUnitDto
{
    /// <summary>
    /// Unit ID.
    /// </summary>
    public Guid UnitId { get; init; }

    /// <summary>
    /// Unit number (e.g., "A-101").
    /// </summary>
    public string UnitNumber { get; init; } = string.Empty;

    /// <summary>
    /// Block name.
    /// </summary>
    public string? BlockName { get; init; }

    /// <summary>
    /// Floor name.
    /// </summary>
    public string? FloorName { get; init; }

    /// <summary>
    /// Unit type name.
    /// </summary>
    public string? UnitTypeName { get; init; }

    /// <summary>
    /// Area in square feet.
    /// </summary>
    public decimal? AreaSqft { get; init; }

    /// <summary>
    /// The current user's lease for this unit.
    /// </summary>
    public MyLeaseDto? Lease { get; init; }

    /// <summary>
    /// List of residents (co-residents) on the same lease.
    /// </summary>
    public List<MyResidentDto> Residents { get; init; } = new();
}

/// <summary>
/// DTO for the current user's lease information.
/// </summary>
public record MyLeaseDto
{
    /// <summary>
    /// Lease ID.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// Current status of the lease.
    /// </summary>
    public LeaseStatus Status { get; init; }

    /// <summary>
    /// Start date of the lease.
    /// </summary>
    public DateOnly StartDate { get; init; }

    /// <summary>
    /// End date of the lease (null for open-ended).
    /// </summary>
    public DateOnly? EndDate { get; init; }

    /// <summary>
    /// Current user's role in the lease (PrimaryResident, CoResident, etc.).
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Whether the current user is the primary party on the lease.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Date when the current user moved into the unit.
    /// </summary>
    public DateOnly? MoveInDate { get; init; }

    /// <summary>
    /// Date when the current user moved out (if applicable).
    /// </summary>
    public DateOnly? MoveOutDate { get; init; }
}

/// <summary>
/// DTO for a resident (co-resident) on the same lease.
/// </summary>
public record MyResidentDto
{
    /// <summary>
    /// Party ID.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// LeaseParty ID.
    /// </summary>
    public Guid LeasePartyId { get; init; }

    /// <summary>
    /// Display name of the resident.
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// Role in the lease (PrimaryResident, CoResident, Guarantor).
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Whether this resident is the primary party on the lease.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Whether this resident has an app account.
    /// </summary>
    public bool HasAppAccess { get; init; }

    /// <summary>
    /// Profile photo URL (if available and visible).
    /// </summary>
    public string? ProfilePhotoUrl { get; init; }
}
