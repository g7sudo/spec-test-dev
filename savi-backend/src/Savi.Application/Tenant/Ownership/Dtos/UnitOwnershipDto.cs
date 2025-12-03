using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Ownership.Dtos;

/// <summary>
/// DTO for unit ownership record.
/// </summary>
public record UnitOwnershipDto
{
    /// <summary>
    /// Unique identifier of the ownership record.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The unit being owned.
    /// </summary>
    public Guid UnitId { get; init; }

    /// <summary>
    /// Unit number for display.
    /// </summary>
    public string UnitNumber { get; init; } = string.Empty;

    /// <summary>
    /// Block name the unit belongs to.
    /// </summary>
    public string? BlockName { get; init; }

    /// <summary>
    /// Floor name the unit belongs to.
    /// </summary>
    public string? FloorName { get; init; }

    /// <summary>
    /// The party who owns the unit.
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
    /// Ownership share as a percentage.
    /// </summary>
    public decimal OwnershipShare { get; init; }

    /// <summary>
    /// Date when ownership started.
    /// </summary>
    public DateOnly FromDate { get; init; }

    /// <summary>
    /// Date when ownership ended. Null means still active.
    /// </summary>
    public DateOnly? ToDate { get; init; }

    /// <summary>
    /// Whether this is the primary owner among joint owners.
    /// </summary>
    public bool IsPrimaryOwner { get; init; }

    /// <summary>
    /// Whether this ownership is currently active.
    /// </summary>
    public bool IsCurrentlyActive => ToDate == null;

    /// <summary>
    /// Whether the record is active.
    /// </summary>
    public bool IsActive { get; init; }

    /// <summary>
    /// When the record was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}
