using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Leases.Dtos;

/// <summary>
/// DTO for lease record with full details.
/// </summary>
public record LeaseDto
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
    /// Floor name the unit belongs to.
    /// </summary>
    public string? FloorName { get; init; }

    /// <summary>
    /// Current status of the lease.
    /// </summary>
    public LeaseStatus Status { get; init; }

    /// <summary>
    /// Start date of the lease.
    /// </summary>
    public DateOnly StartDate { get; init; }

    /// <summary>
    /// End date of the lease. Null for open-ended leases.
    /// </summary>
    public DateOnly? EndDate { get; init; }

    /// <summary>
    /// Monthly rent amount.
    /// </summary>
    public decimal? MonthlyRent { get; init; }

    /// <summary>
    /// Security deposit amount.
    /// </summary>
    public decimal? DepositAmount { get; init; }

    /// <summary>
    /// Additional notes about the lease.
    /// </summary>
    public string? Notes { get; init; }

    /// <summary>
    /// When the lease was activated.
    /// </summary>
    public DateTime? ActivatedAt { get; init; }

    /// <summary>
    /// When the lease was ended or terminated.
    /// </summary>
    public DateTime? EndedAt { get; init; }

    /// <summary>
    /// Reason for termination (if terminated early).
    /// </summary>
    public string? TerminationReason { get; init; }

    /// <summary>
    /// Parties associated with this lease.
    /// </summary>
    public List<LeasePartyDto> Parties { get; init; } = new();

    /// <summary>
    /// Whether the record is active.
    /// </summary>
    public bool IsActive { get; init; }

    /// <summary>
    /// When the record was created.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}
