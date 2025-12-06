using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a booking of an amenity for a specific unit and user.
/// Maps to DBML: Table AmenityBooking
/// </summary>
public class AmenityBooking : BaseEntity
{
    /// <summary>
    /// The amenity being booked.
    /// </summary>
    public Guid AmenityId { get; private set; }

    /// <summary>
    /// The unit this booking is for.
    /// </summary>
    public Guid UnitId { get; private set; }

    /// <summary>
    /// The community user the booking is for.
    /// </summary>
    public Guid BookedForUserId { get; private set; }

    /// <summary>
    /// Start time of the booking.
    /// </summary>
    public DateTime StartAt { get; private set; }

    /// <summary>
    /// End time of the booking.
    /// </summary>
    public DateTime EndAt { get; private set; }

    /// <summary>
    /// Current status of the booking.
    /// </summary>
    public AmenityBookingStatus Status { get; private set; }

    /// <summary>
    /// Source of the booking request.
    /// </summary>
    public AmenityBookingSource Source { get; private set; }

    /// <summary>
    /// Purpose or title of the booking (e.g., Birthday Party).
    /// </summary>
    public string? Title { get; private set; }

    /// <summary>
    /// Resident notes for the booking.
    /// </summary>
    public string? Notes { get; private set; }

    /// <summary>
    /// Internal admin/staff notes.
    /// </summary>
    public string? AdminNotes { get; private set; }

    /// <summary>
    /// Number of expected guests.
    /// </summary>
    public int? NumberOfGuests { get; private set; }

    // Approval tracking

    /// <summary>
    /// When the booking was approved.
    /// </summary>
    public DateTime? ApprovedAt { get; private set; }

    /// <summary>
    /// User who approved the booking.
    /// </summary>
    public Guid? ApprovedByUserId { get; private set; }

    /// <summary>
    /// When the booking was rejected.
    /// </summary>
    public DateTime? RejectedAt { get; private set; }

    /// <summary>
    /// User who rejected the booking.
    /// </summary>
    public Guid? RejectedByUserId { get; private set; }

    /// <summary>
    /// Reason for rejection.
    /// </summary>
    public string? RejectionReason { get; private set; }

    /// <summary>
    /// When the booking was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; private set; }

    /// <summary>
    /// User who cancelled the booking.
    /// </summary>
    public Guid? CancelledByUserId { get; private set; }

    /// <summary>
    /// Reason for cancellation.
    /// </summary>
    public string? CancellationReason { get; private set; }

    /// <summary>
    /// When the booking was completed.
    /// </summary>
    public DateTime? CompletedAt { get; private set; }

    // Deposit tracking (snapshot from Amenity at booking time)

    /// <summary>
    /// Whether deposit was required at booking time.
    /// </summary>
    public bool DepositRequired { get; private set; }

    /// <summary>
    /// Deposit amount at booking time.
    /// </summary>
    public decimal? DepositAmount { get; private set; }

    /// <summary>
    /// Current status of the deposit.
    /// </summary>
    public AmenityDepositStatus DepositStatus { get; private set; }

    /// <summary>
    /// Free text receipt/reference for the deposit.
    /// </summary>
    public string? DepositReference { get; private set; }

    // EF Core constructor
    private AmenityBooking() { }

    /// <summary>
    /// Creates a new amenity booking.
    /// </summary>
    public static AmenityBooking Create(
        Guid amenityId,
        Guid unitId,
        Guid bookedForUserId,
        DateTime startAt,
        DateTime endAt,
        AmenityBookingSource source,
        string? title,
        string? notes,
        int? numberOfGuests,
        bool requiresApproval,
        bool depositRequired,
        decimal? depositAmount,
        Guid createdBy)
    {
        if (endAt <= startAt)
            throw new ArgumentException("End time must be after start time.", nameof(endAt));

        if (numberOfGuests.HasValue && numberOfGuests.Value < 0)
            throw new ArgumentException("Number of guests cannot be negative.", nameof(numberOfGuests));

        var booking = new AmenityBooking
        {
            AmenityId = amenityId,
            UnitId = unitId,
            BookedForUserId = bookedForUserId,
            StartAt = startAt,
            EndAt = endAt,
            Status = requiresApproval ? AmenityBookingStatus.PendingApproval : AmenityBookingStatus.Approved,
            Source = source,
            Title = title,
            Notes = notes,
            NumberOfGuests = numberOfGuests,
            DepositRequired = depositRequired,
            DepositAmount = depositRequired ? depositAmount : null,
            DepositStatus = depositRequired ? AmenityDepositStatus.Pending : AmenityDepositStatus.NotRequired
        };

        // If auto-approved, set approval info
        if (!requiresApproval)
        {
            booking.ApprovedAt = DateTime.UtcNow;
            booking.ApprovedByUserId = createdBy; // System auto-approval
        }

        booking.SetCreatedBy(createdBy);
        return booking;
    }

    /// <summary>
    /// Approves the booking.
    /// </summary>
    public void Approve(Guid approvedBy)
    {
        if (Status != AmenityBookingStatus.PendingApproval)
            throw new InvalidOperationException("Only pending bookings can be approved.");

        Status = AmenityBookingStatus.Approved;
        ApprovedAt = DateTime.UtcNow;
        ApprovedByUserId = approvedBy;
        MarkAsUpdated(approvedBy);
    }

    /// <summary>
    /// Rejects the booking.
    /// </summary>
    public void Reject(string reason, Guid rejectedBy)
    {
        if (Status != AmenityBookingStatus.PendingApproval)
            throw new InvalidOperationException("Only pending bookings can be rejected.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required.", nameof(reason));

        Status = AmenityBookingStatus.Rejected;
        RejectedAt = DateTime.UtcNow;
        RejectedByUserId = rejectedBy;
        RejectionReason = reason;
        MarkAsUpdated(rejectedBy);
    }

    /// <summary>
    /// Cancels the booking by resident.
    /// </summary>
    public void CancelByResident(string? reason, Guid cancelledBy)
    {
        if (Status != AmenityBookingStatus.PendingApproval && Status != AmenityBookingStatus.Approved)
            throw new InvalidOperationException("Only pending or approved bookings can be cancelled.");

        Status = AmenityBookingStatus.CancelledByResident;
        CancelledAt = DateTime.UtcNow;
        CancelledByUserId = cancelledBy;
        CancellationReason = reason;
        MarkAsUpdated(cancelledBy);
    }

    /// <summary>
    /// Cancels the booking by admin.
    /// </summary>
    public void CancelByAdmin(string reason, Guid cancelledBy)
    {
        if (Status != AmenityBookingStatus.PendingApproval && Status != AmenityBookingStatus.Approved)
            throw new InvalidOperationException("Only pending or approved bookings can be cancelled.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cancellation reason is required for admin cancellation.", nameof(reason));

        Status = AmenityBookingStatus.CancelledByAdmin;
        CancelledAt = DateTime.UtcNow;
        CancelledByUserId = cancelledBy;
        CancellationReason = reason;
        MarkAsUpdated(cancelledBy);
    }

    /// <summary>
    /// Marks the booking as completed.
    /// </summary>
    public void Complete(Guid completedBy)
    {
        if (Status != AmenityBookingStatus.Approved)
            throw new InvalidOperationException("Only approved bookings can be completed.");

        Status = AmenityBookingStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        MarkAsUpdated(completedBy);
    }

    /// <summary>
    /// Marks the booking as no-show.
    /// </summary>
    public void MarkNoShow(Guid markedBy)
    {
        if (Status != AmenityBookingStatus.Approved)
            throw new InvalidOperationException("Only approved bookings can be marked as no-show.");

        Status = AmenityBookingStatus.NoShow;
        MarkAsUpdated(markedBy);
    }

    /// <summary>
    /// Marks deposit as paid.
    /// </summary>
    public void MarkDepositPaid(string? reference, Guid markedBy)
    {
        if (!DepositRequired)
            throw new InvalidOperationException("Deposit is not required for this booking.");

        if (DepositStatus != AmenityDepositStatus.Pending)
            throw new InvalidOperationException("Deposit can only be marked paid when pending.");

        DepositStatus = AmenityDepositStatus.Paid;
        DepositReference = reference;
        MarkAsUpdated(markedBy);
    }

    /// <summary>
    /// Refunds the deposit.
    /// </summary>
    public void RefundDeposit(Guid refundedBy)
    {
        if (!DepositRequired)
            throw new InvalidOperationException("Deposit is not required for this booking.");

        if (DepositStatus != AmenityDepositStatus.Paid)
            throw new InvalidOperationException("Only paid deposits can be refunded.");

        DepositStatus = AmenityDepositStatus.Refunded;
        MarkAsUpdated(refundedBy);
    }

    /// <summary>
    /// Forfeits the deposit.
    /// </summary>
    public void ForfeitDeposit(Guid forfeitedBy)
    {
        if (!DepositRequired)
            throw new InvalidOperationException("Deposit is not required for this booking.");

        if (DepositStatus != AmenityDepositStatus.Paid && DepositStatus != AmenityDepositStatus.Pending)
            throw new InvalidOperationException("Only pending or paid deposits can be forfeited.");

        DepositStatus = AmenityDepositStatus.Forfeited;
        MarkAsUpdated(forfeitedBy);
    }

    /// <summary>
    /// Updates admin notes.
    /// </summary>
    public void UpdateAdminNotes(string? adminNotes, Guid updatedBy)
    {
        AdminNotes = adminNotes;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if the booking can be cancelled.
    /// </summary>
    public bool CanBeCancelled => Status == AmenityBookingStatus.PendingApproval || Status == AmenityBookingStatus.Approved;

    /// <summary>
    /// Checks if the booking is in a terminal state.
    /// </summary>
    public bool IsTerminal => Status == AmenityBookingStatus.Rejected ||
                              Status == AmenityBookingStatus.CancelledByResident ||
                              Status == AmenityBookingStatus.CancelledByAdmin ||
                              Status == AmenityBookingStatus.Completed ||
                              Status == AmenityBookingStatus.NoShow;
}
