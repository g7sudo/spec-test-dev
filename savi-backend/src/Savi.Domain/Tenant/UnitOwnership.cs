using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents ownership of a unit by a party.
/// Supports joint ownership (multiple parties per unit) and ownership history.
/// Maps to DBML: Table UnitOwnership
/// </summary>
public class UnitOwnership : BaseEntity
{
    /// <summary>
    /// The unit being owned.
    /// </summary>
    public Guid UnitId { get; private set; }

    /// <summary>
    /// The party (individual, company, or entity) who owns the unit.
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Ownership share as a percentage (e.g., 100 for sole ownership, 50 for joint).
    /// </summary>
    public decimal OwnershipShare { get; private set; }

    /// <summary>
    /// Date when ownership started.
    /// </summary>
    public DateOnly FromDate { get; private set; }

    /// <summary>
    /// Date when ownership ended. Null means ownership is still active.
    /// </summary>
    public DateOnly? ToDate { get; private set; }

    /// <summary>
    /// Indicates if this party is the primary owner among joint owners.
    /// </summary>
    public bool IsPrimaryOwner { get; private set; }

    // EF Core constructor
    private UnitOwnership() { }

    /// <summary>
    /// Creates a new unit ownership record.
    /// </summary>
    public static UnitOwnership Create(
        Guid unitId,
        Guid partyId,
        decimal ownershipShare,
        DateOnly fromDate,
        bool isPrimaryOwner,
        Guid createdBy)
    {
        if (ownershipShare <= 0 || ownershipShare > 100)
        {
            throw new ArgumentException("Ownership share must be between 0 and 100.", nameof(ownershipShare));
        }

        var ownership = new UnitOwnership
        {
            UnitId = unitId,
            PartyId = partyId,
            OwnershipShare = ownershipShare,
            FromDate = fromDate,
            ToDate = null,
            IsPrimaryOwner = isPrimaryOwner
        };

        ownership.SetCreatedBy(createdBy);
        return ownership;
    }

    /// <summary>
    /// Updates the ownership details.
    /// </summary>
    public void Update(
        decimal ownershipShare,
        DateOnly fromDate,
        bool isPrimaryOwner,
        Guid updatedBy)
    {
        if (ownershipShare <= 0 || ownershipShare > 100)
        {
            throw new ArgumentException("Ownership share must be between 0 and 100.", nameof(ownershipShare));
        }

        OwnershipShare = ownershipShare;
        FromDate = fromDate;
        IsPrimaryOwner = isPrimaryOwner;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Ends the ownership by setting the ToDate.
    /// </summary>
    public void EndOwnership(DateOnly endDate, Guid updatedBy)
    {
        if (endDate < FromDate)
        {
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));
        }

        ToDate = endDate;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets or clears the primary owner flag.
    /// </summary>
    public void SetPrimaryOwner(bool isPrimary, Guid updatedBy)
    {
        IsPrimaryOwner = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if this ownership is currently active (no end date and IsActive).
    /// </summary>
    public bool IsCurrentlyActive => IsActive && ToDate == null;
}
