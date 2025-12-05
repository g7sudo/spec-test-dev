using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Links parties (individuals/companies) to a lease as residents or guarantors.
/// Supports primary and co-residents.
/// Maps to DBML: Table LeaseParty
/// </summary>
public class LeaseParty : BaseEntity
{
    /// <summary>
    /// The lease this party belongs to.
    /// </summary>
    public Guid LeaseId { get; private set; }

    /// <summary>
    /// The party (individual, company, or entity) on the lease.
    /// </summary>
    public Guid PartyId { get; private set; }

    /// <summary>
    /// Optional link to the CommunityUser if this party has an app account.
    /// </summary>
    public Guid? CommunityUserId { get; private set; }

    /// <summary>
    /// Role of this party in the lease (PrimaryResident, CoResident, Guarantor, etc.).
    /// </summary>
    public LeasePartyRole Role { get; private set; }

    /// <summary>
    /// Indicates if this is the primary party for the lease.
    /// Only one party should be marked as primary per lease.
    /// </summary>
    public bool IsPrimary { get; private set; }

    /// <summary>
    /// Date when this party moved into the unit.
    /// </summary>
    public DateOnly? MoveInDate { get; private set; }

    /// <summary>
    /// Date when this party moved out of the unit.
    /// </summary>
    public DateOnly? MoveOutDate { get; private set; }

    // EF Core constructor
    private LeaseParty() { }

    /// <summary>
    /// Creates a new lease party association.
    /// </summary>
    public static LeaseParty Create(
        Guid leaseId,
        Guid partyId,
        LeasePartyRole role,
        bool isPrimary,
        DateOnly? moveInDate,
        Guid createdBy)
    {
        var leaseParty = new LeaseParty
        {
            LeaseId = leaseId,
            PartyId = partyId,
            Role = role,
            IsPrimary = isPrimary,
            MoveInDate = moveInDate,
            MoveOutDate = null,
            CommunityUserId = null
        };

        leaseParty.SetCreatedBy(createdBy);
        return leaseParty;
    }

    /// <summary>
    /// Links this lease party to a community user account.
    /// Called when the party creates/accepts an app account.
    /// </summary>
    public void LinkToCommunityUser(Guid communityUserId, Guid updatedBy)
    {
        CommunityUserId = communityUserId;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the role and primary status.
    /// </summary>
    public void UpdateRole(LeasePartyRole role, bool isPrimary, Guid updatedBy)
    {
        Role = role;
        IsPrimary = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets or updates the move-in date.
    /// </summary>
    public void SetMoveInDate(DateOnly moveInDate, Guid updatedBy)
    {
        if (MoveOutDate.HasValue && moveInDate > MoveOutDate.Value)
        {
            throw new ArgumentException("Move-in date cannot be after move-out date.", nameof(moveInDate));
        }

        MoveInDate = moveInDate;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Records when the party moved out.
    /// </summary>
    public void SetMoveOutDate(DateOnly moveOutDate, Guid updatedBy)
    {
        if (MoveInDate.HasValue && moveOutDate < MoveInDate.Value)
        {
            throw new ArgumentException("Move-out date cannot be before move-in date.", nameof(moveOutDate));
        }

        MoveOutDate = moveOutDate;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets or clears the primary flag.
    /// </summary>
    public void SetPrimary(bool isPrimary, Guid updatedBy)
    {
        IsPrimary = isPrimary;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if this party is currently residing (has moved in but not moved out).
    /// </summary>
    public bool IsCurrentlyResiding => IsActive && MoveInDate.HasValue && !MoveOutDate.HasValue;

    /// <summary>
    /// Checks if this party has an app account.
    /// </summary>
    public bool HasAppAccount => CommunityUserId.HasValue;
}
