using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Leases.Dtos;

/// <summary>
/// DTO for lease party record.
/// </summary>
public record LeasePartyDto
{
    /// <summary>
    /// Unique identifier of the lease party record.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The lease this party belongs to.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// The party (individual, company, or entity) on the lease.
    /// </summary>
    public Guid PartyId { get; init; }

    /// <summary>
    /// Party display name.
    /// </summary>
    public string PartyName { get; init; } = string.Empty;

    /// <summary>
    /// Type of party (Individual, Company, Entity).
    /// </summary>
    public PartyType PartyType { get; init; }

    /// <summary>
    /// Optional link to the CommunityUser if this party has an app account.
    /// </summary>
    public Guid? CommunityUserId { get; init; }

    /// <summary>
    /// Role of this party in the lease.
    /// </summary>
    public LeasePartyRole Role { get; init; }

    /// <summary>
    /// Whether this is the primary party for the lease.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Date when this party moved into the unit.
    /// </summary>
    public DateOnly? MoveInDate { get; init; }

    /// <summary>
    /// Date when this party moved out of the unit.
    /// </summary>
    public DateOnly? MoveOutDate { get; init; }

    /// <summary>
    /// Whether this party has an app account.
    /// </summary>
    public bool HasAppAccount => CommunityUserId.HasValue;

    /// <summary>
    /// Whether this party is currently residing.
    /// </summary>
    public bool IsCurrentlyResiding => MoveInDate.HasValue && !MoveOutDate.HasValue;

    /// <summary>
    /// Whether the record is active.
    /// </summary>
    public bool IsActive { get; init; }
}
