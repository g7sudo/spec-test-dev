using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Leases.Dtos;

/// <summary>
/// Summary DTO for lease record (for list views).
/// </summary>
public record LeaseSummaryDto
{
    /// <summary>
    /// Unique identifier of the lease.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// The unit this lease is for.
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
    /// Current status of the lease.
    /// </summary>
    public LeaseStatus Status { get; init; }

    /// <summary>
    /// Start date of the lease.
    /// </summary>
    public DateOnly StartDate { get; init; }

    /// <summary>
    /// End date of the lease.
    /// </summary>
    public DateOnly? EndDate { get; init; }

    /// <summary>
    /// Primary resident name.
    /// </summary>
    public string? PrimaryResidentName { get; init; }

    /// <summary>
    /// Number of parties on this lease.
    /// </summary>
    public int PartyCount { get; init; }

    /// <summary>
    /// Monthly rent amount.
    /// </summary>
    public decimal? MonthlyRent { get; init; }

    /// <summary>
    /// When the record was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}
