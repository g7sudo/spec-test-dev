using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a rental/occupancy contract for a unit.
/// Maps to DBML: Table Lease
/// </summary>
public class Lease : BaseEntity
{
    /// <summary>
    /// The unit this lease is for.
    /// </summary>
    public Guid UnitId { get; private set; }

    /// <summary>
    /// Current status of the lease.
    /// </summary>
    public LeaseStatus Status { get; private set; }

    /// <summary>
    /// Start date of the lease.
    /// </summary>
    public DateOnly StartDate { get; private set; }

    /// <summary>
    /// End date of the lease. Null for open-ended leases.
    /// </summary>
    public DateOnly? EndDate { get; private set; }

    /// <summary>
    /// Monthly rent amount.
    /// </summary>
    public decimal? MonthlyRent { get; private set; }

    /// <summary>
    /// Security deposit amount.
    /// </summary>
    public decimal? DepositAmount { get; private set; }

    /// <summary>
    /// Additional notes about the lease.
    /// </summary>
    public string? Notes { get; private set; }

    /// <summary>
    /// When the lease was activated.
    /// </summary>
    public DateTime? ActivatedAt { get; private set; }

    /// <summary>
    /// When the lease was ended or terminated.
    /// </summary>
    public DateTime? EndedAt { get; private set; }

    /// <summary>
    /// Reason for termination (if terminated early).
    /// </summary>
    public string? TerminationReason { get; private set; }

    // Navigation property - not persisted directly, configured via EF
    private readonly List<LeaseParty> _leaseParties = new();
    public IReadOnlyCollection<LeaseParty> LeaseParties => _leaseParties.AsReadOnly();

    // EF Core constructor
    private Lease() { }

    /// <summary>
    /// Creates a new lease in Draft status.
    /// </summary>
    public static Lease Create(
        Guid unitId,
        DateOnly startDate,
        DateOnly? endDate,
        decimal? monthlyRent,
        decimal? depositAmount,
        string? notes,
        Guid createdBy)
    {
        if (endDate.HasValue && endDate.Value < startDate)
        {
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));
        }

        if (monthlyRent.HasValue && monthlyRent.Value < 0)
        {
            throw new ArgumentException("Monthly rent cannot be negative.", nameof(monthlyRent));
        }

        if (depositAmount.HasValue && depositAmount.Value < 0)
        {
            throw new ArgumentException("Deposit amount cannot be negative.", nameof(depositAmount));
        }

        var lease = new Lease
        {
            UnitId = unitId,
            Status = LeaseStatus.Draft,
            StartDate = startDate,
            EndDate = endDate,
            MonthlyRent = monthlyRent,
            DepositAmount = depositAmount,
            Notes = notes
        };

        lease.SetCreatedBy(createdBy);
        return lease;
    }

    /// <summary>
    /// Updates the lease details. Only allowed when lease is in Draft status.
    /// </summary>
    public void Update(
        DateOnly startDate,
        DateOnly? endDate,
        decimal? monthlyRent,
        decimal? depositAmount,
        string? notes,
        Guid updatedBy)
    {
        if (Status != LeaseStatus.Draft)
        {
            throw new InvalidOperationException("Cannot update lease details after it has been activated.");
        }

        if (endDate.HasValue && endDate.Value < startDate)
        {
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));
        }

        if (monthlyRent.HasValue && monthlyRent.Value < 0)
        {
            throw new ArgumentException("Monthly rent cannot be negative.", nameof(monthlyRent));
        }

        if (depositAmount.HasValue && depositAmount.Value < 0)
        {
            throw new ArgumentException("Deposit amount cannot be negative.", nameof(depositAmount));
        }

        StartDate = startDate;
        EndDate = endDate;
        MonthlyRent = monthlyRent;
        DepositAmount = depositAmount;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Activates the lease. Requires at least one primary resident.
    /// </summary>
    public void Activate(Guid activatedBy)
    {
        if (Status != LeaseStatus.Draft)
        {
            throw new InvalidOperationException("Only draft leases can be activated.");
        }

        Status = LeaseStatus.Active;
        ActivatedAt = DateTime.UtcNow;
        MarkAsUpdated(activatedBy);
    }

    /// <summary>
    /// Ends the lease normally.
    /// </summary>
    public void End(Guid endedBy)
    {
        if (Status != LeaseStatus.Active)
        {
            throw new InvalidOperationException("Only active leases can be ended.");
        }

        Status = LeaseStatus.Ended;
        EndedAt = DateTime.UtcNow;
        MarkAsUpdated(endedBy);
    }

    /// <summary>
    /// Terminates the lease early with a reason.
    /// </summary>
    public void Terminate(string reason, Guid terminatedBy)
    {
        if (Status != LeaseStatus.Active)
        {
            throw new InvalidOperationException("Only active leases can be terminated.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Termination reason is required.", nameof(reason));
        }

        Status = LeaseStatus.Terminated;
        EndedAt = DateTime.UtcNow;
        TerminationReason = reason;
        MarkAsUpdated(terminatedBy);
    }

    /// <summary>
    /// Checks if this lease is currently active.
    /// </summary>
    public bool IsCurrentlyActive => IsActive && Status == LeaseStatus.Active;

    /// <summary>
    /// Checks if lease can be modified (only in Draft status).
    /// </summary>
    public bool CanBeModified => Status == LeaseStatus.Draft;
}
