using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Tracks extra-cost approval for a maintenance request and (optionally) whether owner payment was received.
/// Maps to DBML: Table MaintenanceApproval
/// </summary>
public class MaintenanceApproval : BaseEntity
{
    /// <summary>
    /// The maintenance request this approval is for.
    /// </summary>
    public Guid MaintenanceRequestId { get; private set; }

    /// <summary>
    /// Current approval status.
    /// </summary>
    public MaintenanceApprovalStatus Status { get; private set; }

    /// <summary>
    /// Total estimated cost to be approved (sum of detail lines).
    /// </summary>
    public decimal? RequestedAmount { get; private set; }

    /// <summary>
    /// Optional currency code (e.g., BHD).
    /// </summary>
    public string? Currency { get; private set; }

    /// <summary>
    /// Staff who raised the approval request.
    /// </summary>
    public Guid RequestedByUserId { get; private set; }

    /// <summary>
    /// When the approval was requested.
    /// </summary>
    public DateTime RequestedAt { get; private set; }

    /// <summary>
    /// Owner/resident who approved the request.
    /// </summary>
    public Guid? ApprovedByUserId { get; private set; }

    /// <summary>
    /// When the request was approved.
    /// </summary>
    public DateTime? ApprovedAt { get; private set; }

    /// <summary>
    /// Reason for rejection.
    /// </summary>
    public string? RejectionReason { get; private set; }

    /// <summary>
    /// When the approval was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; private set; }

    /// <summary>
    /// User who cancelled the approval.
    /// </summary>
    public Guid? CancelledByUserId { get; private set; }

    /// <summary>
    /// Reason for cancellation.
    /// </summary>
    public string? CancellationReason { get; private set; }

    // --- Owner payment tracking

    /// <summary>
    /// Status of owner payment.
    /// </summary>
    public MaintenanceOwnerPaymentStatus OwnerPaymentStatus { get; private set; }

    /// <summary>
    /// Actual amount paid by owner for this approved request.
    /// </summary>
    public decimal? OwnerPaidAmount { get; private set; }

    /// <summary>
    /// When the owner paid.
    /// </summary>
    public DateTime? OwnerPaidAt { get; private set; }

    /// <summary>
    /// Receipt number, transaction ID, or internal note.
    /// </summary>
    public string? OwnerPaymentReference { get; private set; }

    // EF Core constructor
    private MaintenanceApproval() { }

    /// <summary>
    /// Creates a new maintenance approval request.
    /// </summary>
    public static MaintenanceApproval Create(
        Guid maintenanceRequestId,
        decimal? requestedAmount,
        string? currency,
        Guid requestedByUserId,
        bool requiresOwnerPayment,
        Guid createdBy)
    {
        var approval = new MaintenanceApproval
        {
            MaintenanceRequestId = maintenanceRequestId,
            Status = MaintenanceApprovalStatus.Pending,
            RequestedAmount = requestedAmount,
            Currency = currency,
            RequestedByUserId = requestedByUserId,
            RequestedAt = DateTime.UtcNow,
            OwnerPaymentStatus = requiresOwnerPayment
                ? MaintenanceOwnerPaymentStatus.Pending
                : MaintenanceOwnerPaymentStatus.NotRequired
        };

        approval.SetCreatedBy(createdBy);
        return approval;
    }

    /// <summary>
    /// Creates an approval record with NotRequired status (for small/internal jobs).
    /// </summary>
    public static MaintenanceApproval CreateNotRequired(
        Guid maintenanceRequestId,
        Guid requestedByUserId,
        Guid createdBy)
    {
        var approval = new MaintenanceApproval
        {
            MaintenanceRequestId = maintenanceRequestId,
            Status = MaintenanceApprovalStatus.NotRequired,
            RequestedByUserId = requestedByUserId,
            RequestedAt = DateTime.UtcNow,
            OwnerPaymentStatus = MaintenanceOwnerPaymentStatus.NotRequired
        };

        approval.SetCreatedBy(createdBy);
        return approval;
    }

    /// <summary>
    /// Approves the request.
    /// </summary>
    public void Approve(Guid approvedByUserId, Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Pending)
            throw new InvalidOperationException("Can only approve a pending approval request.");

        Status = MaintenanceApprovalStatus.Approved;
        ApprovedByUserId = approvedByUserId;
        ApprovedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Rejects the request.
    /// </summary>
    public void Reject(string reason, Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Pending)
            throw new InvalidOperationException("Can only reject a pending approval request.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required.", nameof(reason));

        Status = MaintenanceApprovalStatus.Rejected;
        RejectionReason = reason;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Cancels the approval request.
    /// </summary>
    public void Cancel(string reason, Guid cancelledByUserId, Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Pending)
            throw new InvalidOperationException("Can only cancel a pending approval request.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cancellation reason is required.", nameof(reason));

        Status = MaintenanceApprovalStatus.Cancelled;
        CancellationReason = reason;
        CancelledByUserId = cancelledByUserId;
        CancelledAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Records owner payment.
    /// </summary>
    public void RecordPayment(
        decimal paidAmount,
        string? paymentReference,
        Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Approved)
            throw new InvalidOperationException("Can only record payment for approved requests.");

        if (paidAmount <= 0)
            throw new ArgumentException("Paid amount must be positive.", nameof(paidAmount));

        OwnerPaymentStatus = MaintenanceOwnerPaymentStatus.Paid;
        OwnerPaidAmount = paidAmount;
        OwnerPaidAt = DateTime.UtcNow;
        OwnerPaymentReference = paymentReference;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Waives the owner payment.
    /// </summary>
    public void WaivePayment(Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Approved)
            throw new InvalidOperationException("Can only waive payment for approved requests.");

        OwnerPaymentStatus = MaintenanceOwnerPaymentStatus.Waived;
        OwnerPaidAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the requested amount.
    /// </summary>
    public void UpdateAmount(decimal? amount, string? currency, Guid updatedBy)
    {
        if (Status != MaintenanceApprovalStatus.Pending)
            throw new InvalidOperationException("Can only update amount for pending approval requests.");

        RequestedAmount = amount;
        Currency = currency;

        MarkAsUpdated(updatedBy);
    }
}
