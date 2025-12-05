using Savi.Application.Tenant.Leases.Dtos;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Residents.Dtos;

/// <summary>
/// Comprehensive resident profile DTO combining Party, LeaseParties, Invites, and Account info.
/// </summary>
public record ResidentProfileDto
{
    /// <summary>
    /// The Party ID.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Resident name.
    /// </summary>
    public string ResidentName { get; init; } = string.Empty;

    /// <summary>
    /// Party type.
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Party type as text.
    /// </summary>
    public string PartyTypeText => PartyType.ToString();

    /// <summary>
    /// Primary email address.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Primary phone number.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// Current unit information (if currently residing).
    /// </summary>
    public ResidentUnitDto? CurrentUnit { get; init; }

    /// <summary>
    /// Current residency status.
    /// </summary>
    public ResidencyStatus Status { get; init; }

    /// <summary>
    /// Current residency status as text.
    /// </summary>
    public string StatusText => Status.ToString();

    /// <summary>
    /// Whether this resident has an app account.
    /// </summary>
    public bool HasAppAccess { get; init; }

    /// <summary>
    /// CommunityUser ID if has app access.
    /// </summary>
    public Guid? CommunityUserId { get; init; }

    /// <summary>
    /// Email used for login (from CommunityUser).
    /// </summary>
    public string? LoginEmail { get; init; }

    /// <summary>
    /// Last login time (if available).
    /// </summary>
    public DateTime? LastLoginAt { get; init; }

    /// <summary>
    /// All lease party records (current and past residencies).
    /// </summary>
    public List<ResidentLeaseDto> Residencies { get; init; } = new();

    /// <summary>
    /// All resident invites for this party.
    /// </summary>
    public List<ResidentInviteDto> Invites { get; init; } = new();

    /// <summary>
    /// When the party record was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Unit summary for resident profile.
/// </summary>
public record ResidentUnitDto
{
    public Guid UnitId { get; init; }
    public string UnitNumber { get; init; } = string.Empty;
    public string? BlockName { get; init; }
    public string? FloorName { get; init; }
}

/// <summary>
/// Lease record summary for resident profile.
/// </summary>
public record ResidentLeaseDto
{
    /// <summary>
    /// LeaseParty record ID.
    /// </summary>
    public Guid LeasePartyId { get; init; }

    /// <summary>
    /// Lease ID.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// Unit information.
    /// </summary>
    public ResidentUnitDto Unit { get; init; } = new();

    /// <summary>
    /// Lease status.
    /// </summary>
    public LeaseStatus LeaseStatus { get; init; }

    /// <summary>
    /// Lease status as text.
    /// </summary>
    public string LeaseStatusText => LeaseStatus.ToString();

    /// <summary>
    /// Role in this lease.
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Role as text.
    /// </summary>
    public string RoleText => Role.ToString();

    /// <summary>
    /// Whether primary for this lease.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Lease start date.
    /// </summary>
    public DateOnly StartDate { get; init; }

    /// <summary>
    /// Lease end date.
    /// </summary>
    public DateOnly? EndDate { get; init; }

    /// <summary>
    /// Move-in date.
    /// </summary>
    public DateOnly? MoveInDate { get; init; }

    /// <summary>
    /// Move-out date.
    /// </summary>
    public DateOnly? MoveOutDate { get; init; }

    /// <summary>
    /// Whether this is a current residency.
    /// </summary>
    public bool IsCurrent { get; init; }

    /// <summary>
    /// Co-residents in this same lease.
    /// </summary>
    public List<CoResidentDto> CoResidents { get; init; } = new();
}

/// <summary>
/// Co-resident summary.
/// </summary>
public record CoResidentDto
{
    public Guid LeasePartyId { get; init; }
    public Guid PartyId { get; init; }
    public string Name { get; init; } = string.Empty;
    public LeasePartyRole Role { get; init; }
    public string RoleText => Role.ToString();
    public bool IsPrimary { get; init; }
    public bool HasAppAccess { get; init; }
}
