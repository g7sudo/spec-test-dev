using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Residents.Dtos;

/// <summary>
/// DTO for resident list item (derived from LeaseParty + Party + Unit + CommunityUser).
/// </summary>
public record ResidentDto
{
    /// <summary>
    /// The LeaseParty record ID.
    /// </summary>
    public Guid LeasePartyId { get; init; }

    /// <summary>
    /// The Party ID (individual, company, or entity).
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Name of the resident (from Party).
    /// </summary>
    public string ResidentName { get; init; } = string.Empty;

    /// <summary>
    /// Type of party.
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Type of party as text.
    /// </summary>
    public string PartyTypeText => PartyType.ToString();

    /// <summary>
    /// Primary email address (from PartyContact).
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Primary phone number (from PartyContact).
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// The lease ID.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// Unit ID where the resident lives.
    /// </summary>
    public Guid UnitId { get; init; }

    /// <summary>
    /// Unit number.
    /// </summary>
    public string UnitNumber { get; init; } = string.Empty;

    /// <summary>
    /// Block name (if applicable).
    /// </summary>
    public string? BlockName { get; init; }

    /// <summary>
    /// Block ID (if applicable).
    /// </summary>
    public Guid? BlockId { get; init; }

    /// <summary>
    /// Floor name (if applicable).
    /// </summary>
    public string? FloorName { get; init; }

    /// <summary>
    /// Floor ID (if applicable).
    /// </summary>
    public Guid? FloorId { get; init; }

    /// <summary>
    /// Residency status: Current, Upcoming, or Past.
    /// </summary>
    public ResidencyStatus Status { get; init; }

    /// <summary>
    /// Residency status as text.
    /// </summary>
    public string StatusText => Status.ToString();

    /// <summary>
    /// Role in the lease (PrimaryResident or CoResident).
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Role as text.
    /// </summary>
    public string RoleText => Role.ToString();

    /// <summary>
    /// Whether this is the primary party for the lease.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Whether this resident has an app account (CommunityUser linked).
    /// </summary>
    public bool HasAppAccess { get; init; }

    /// <summary>
    /// CommunityUser ID if the resident has app access.
    /// </summary>
    public Guid? CommunityUserId { get; init; }

    /// <summary>
    /// Move-in date.
    /// </summary>
    public DateOnly? MoveInDate { get; init; }

    /// <summary>
    /// Move-out date (if moved out).
    /// </summary>
    public DateOnly? MoveOutDate { get; init; }

    /// <summary>
    /// Lease status.
    /// </summary>
    public LeaseStatus LeaseStatus { get; init; }

    /// <summary>
    /// Lease status as text.
    /// </summary>
    public string LeaseStatusText => LeaseStatus.ToString();

    /// <summary>
    /// Lease start date.
    /// </summary>
    public DateOnly StartDate { get; init; }

    /// <summary>
    /// Lease end date (if set).
    /// </summary>
    public DateOnly? EndDate { get; init; }
}

/// <summary>
/// Residency status for filtering residents.
/// </summary>
public enum ResidencyStatus
{
    /// <summary>
    /// Currently residing (lease active, moved in, not moved out).
    /// </summary>
    Current,

    /// <summary>
    /// Upcoming resident (lease active but move-in date in future, or lease in draft).
    /// </summary>
    Upcoming,

    /// <summary>
    /// Past resident (moved out or lease ended).
    /// </summary>
    Past
}
