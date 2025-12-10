using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Represents a single visit of a guest/delivery/service to a specific Unit.
/// Covers pre-registration (with access code), gate handling (walk-in),
/// resident approval, and check-in/out with security audit.
/// Maps to DBML: Table VisitorPass
/// </summary>
public class VisitorPass : BaseEntity
{
    // --- Unit & Source
    /// <summary>
    /// The unit this visitor is coming for.
    /// </summary>
    public Guid UnitId { get; private set; }

    /// <summary>
    /// Type of visit (Guest, Delivery, Service, Other).
    /// </summary>
    public VisitorType VisitType { get; private set; }

    /// <summary>
    /// Source of the visitor pass creation.
    /// </summary>
    public VisitorSource Source { get; private set; }

    // --- Pre-registration access code
    /// <summary>
    /// Resident-shareable access code for pre-registered visits (e.g., 1234-5678).
    /// Null for walk-in visitors created at gate.
    /// </summary>
    public string? AccessCode { get; private set; }

    // --- Who the visit is for
    /// <summary>
    /// Primary resident/user in the unit this visit is for (for reference and audit).
    /// </summary>
    public Guid? RequestedForUserId { get; private set; }

    // --- Visitor details
    /// <summary>
    /// Name of the visitor.
    /// </summary>
    public string VisitorName { get; private set; } = string.Empty;

    /// <summary>
    /// Phone number of the visitor.
    /// </summary>
    public string? VisitorPhone { get; private set; }

    /// <summary>
    /// Type of ID document (e.g., CPR, Passport).
    /// </summary>
    public string? VisitorIdType { get; private set; }

    /// <summary>
    /// ID document number.
    /// </summary>
    public string? VisitorIdNumber { get; private set; }

    // --- Vehicle
    /// <summary>
    /// License plate if captured.
    /// </summary>
    public string? VehicleNumber { get; private set; }

    /// <summary>
    /// Vehicle type (Car, Bike, Van, etc.).
    /// </summary>
    public string? VehicleType { get; private set; }

    // --- Delivery provider
    /// <summary>
    /// Delivery provider name (e.g., Uber Eats, Talabat, Amazon).
    /// Only applicable when VisitType = Delivery.
    /// </summary>
    public string? DeliveryProvider { get; private set; }

    // --- Notes
    /// <summary>
    /// Additional info from resident or security.
    /// </summary>
    public string? Notes { get; private set; }

    // --- Visit timing
    /// <summary>
    /// Start of expected arrival window.
    /// </summary>
    public DateTime? ExpectedFrom { get; private set; }

    /// <summary>
    /// End of expected arrival window.
    /// </summary>
    public DateTime? ExpectedTo { get; private set; }

    /// <summary>
    /// When this pass auto-expires if not used.
    /// </summary>
    public DateTime? ExpiresAt { get; private set; }

    /// <summary>
    /// When the visitor checked in.
    /// </summary>
    public DateTime? CheckInAt { get; private set; }

    /// <summary>
    /// When the visitor checked out.
    /// </summary>
    public DateTime? CheckOutAt { get; private set; }

    /// <summary>
    /// Security user who processed check-in at gate.
    /// </summary>
    public Guid? CheckInByUserId { get; private set; }

    /// <summary>
    /// Security user who processed check-out at gate.
    /// </summary>
    public Guid? CheckOutByUserId { get; private set; }

    // --- Approval & status
    /// <summary>
    /// Current status of the visitor pass.
    /// </summary>
    public VisitorPassStatus Status { get; private set; }

    /// <summary>
    /// Resident/admin who approved entry.
    /// </summary>
    public Guid? ApprovedByUserId { get; private set; }

    /// <summary>
    /// When the pass was approved.
    /// </summary>
    public DateTime? ApprovedAt { get; private set; }

    /// <summary>
    /// User who rejected the pass.
    /// </summary>
    public Guid? RejectedByUserId { get; private set; }

    /// <summary>
    /// When the pass was rejected.
    /// </summary>
    public DateTime? RejectedAt { get; private set; }

    /// <summary>
    /// Reason for rejection.
    /// </summary>
    public string? RejectedReason { get; private set; }

    // --- Notifications
    /// <summary>
    /// If true, notify resident when visitor arrives/uses code at gate.
    /// </summary>
    public bool NotifyVisitorAtGate { get; private set; } = true;

    // EF Core constructor
    private VisitorPass() { }

    /// <summary>
    /// Creates a new pre-registered visitor pass (resident flow).
    /// </summary>
    public static VisitorPass CreatePreRegistered(
        Guid unitId,
        string visitorName,
        VisitorType visitType,
        string accessCode,
        Guid? requestedForUserId,
        string? visitorPhone,
        string? vehicleNumber,
        string? vehicleType,
        string? deliveryProvider,
        string? notes,
        DateTime? expectedFrom,
        DateTime? expectedTo,
        DateTime? expiresAt,
        bool notifyVisitorAtGate,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(visitorName))
            throw new ArgumentException("Visitor name is required.", nameof(visitorName));

        if (string.IsNullOrWhiteSpace(accessCode))
            throw new ArgumentException("Access code is required for pre-registered visits.", nameof(accessCode));

        var pass = new VisitorPass
        {
            UnitId = unitId,
            VisitorName = visitorName,
            VisitType = visitType,
            Source = VisitorSource.MobileApp,
            AccessCode = accessCode,
            RequestedForUserId = requestedForUserId,
            VisitorPhone = visitorPhone,
            VehicleNumber = vehicleNumber,
            VehicleType = vehicleType,
            DeliveryProvider = deliveryProvider,
            Notes = notes,
            ExpectedFrom = expectedFrom,
            ExpectedTo = expectedTo,
            ExpiresAt = expiresAt,
            Status = VisitorPassStatus.PreRegistered,
            NotifyVisitorAtGate = notifyVisitorAtGate
        };

        pass.SetCreatedBy(createdBy);
        return pass;
    }

    /// <summary>
    /// Creates a new walk-in visitor pass (security guard flow).
    /// </summary>
    public static VisitorPass CreateWalkIn(
        Guid unitId,
        string visitorName,
        VisitorType visitType,
        VisitorSource source,
        string? visitorPhone,
        string? visitorIdType,
        string? visitorIdNumber,
        string? vehicleNumber,
        string? vehicleType,
        string? deliveryProvider,
        string? notes,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(visitorName))
            throw new ArgumentException("Visitor name is required.", nameof(visitorName));

        var pass = new VisitorPass
        {
            UnitId = unitId,
            VisitorName = visitorName,
            VisitType = visitType,
            Source = source,
            AccessCode = null, // Walk-ins don't have access codes
            VisitorPhone = visitorPhone,
            VisitorIdType = visitorIdType,
            VisitorIdNumber = visitorIdNumber,
            VehicleNumber = vehicleNumber,
            VehicleType = vehicleType,
            DeliveryProvider = deliveryProvider,
            Notes = notes,
            Status = VisitorPassStatus.AtGatePendingApproval,
            NotifyVisitorAtGate = true
        };

        pass.SetCreatedBy(createdBy);
        return pass;
    }

    /// <summary>
    /// Approves the visitor pass.
    /// </summary>
    public void Approve(Guid approvedByUserId)
    {
        if (Status != VisitorPassStatus.PreRegistered && Status != VisitorPassStatus.AtGatePendingApproval)
            throw new InvalidOperationException($"Cannot approve a pass with status '{Status}'.");

        Status = VisitorPassStatus.Approved;
        ApprovedByUserId = approvedByUserId;
        ApprovedAt = DateTime.UtcNow;
        MarkAsUpdated(approvedByUserId);
    }

    /// <summary>
    /// Rejects the visitor pass.
    /// </summary>
    public void Reject(string reason, Guid rejectedByUserId)
    {
        if (Status != VisitorPassStatus.PreRegistered && Status != VisitorPassStatus.AtGatePendingApproval)
            throw new InvalidOperationException($"Cannot reject a pass with status '{Status}'.");

        Status = VisitorPassStatus.Rejected;
        RejectedByUserId = rejectedByUserId;
        RejectedAt = DateTime.UtcNow;
        RejectedReason = reason;
        MarkAsUpdated(rejectedByUserId);
    }

    /// <summary>
    /// Checks in the visitor at the gate.
    /// </summary>
    public void CheckIn(Guid checkInByUserId)
    {
        if (Status != VisitorPassStatus.PreRegistered && Status != VisitorPassStatus.Approved)
            throw new InvalidOperationException($"Cannot check in a pass with status '{Status}'.");

        Status = VisitorPassStatus.CheckedIn;
        CheckInAt = DateTime.UtcNow;
        CheckInByUserId = checkInByUserId;

        // Auto-approve if pre-registered and checking in via access code
        if (ApprovedByUserId == null)
        {
            ApprovedByUserId = checkInByUserId;
            ApprovedAt = DateTime.UtcNow;
        }

        MarkAsUpdated(checkInByUserId);
    }

    /// <summary>
    /// Checks out the visitor.
    /// </summary>
    public void CheckOut(Guid checkOutByUserId)
    {
        if (Status != VisitorPassStatus.CheckedIn)
            throw new InvalidOperationException($"Cannot check out a pass with status '{Status}'.");

        Status = VisitorPassStatus.CheckedOut;
        CheckOutAt = DateTime.UtcNow;
        CheckOutByUserId = checkOutByUserId;
        MarkAsUpdated(checkOutByUserId);
    }

    /// <summary>
    /// Expires the visitor pass.
    /// </summary>
    public void Expire(Guid? expiredByUserId = null)
    {
        if (Status == VisitorPassStatus.CheckedIn || Status == VisitorPassStatus.CheckedOut)
            throw new InvalidOperationException($"Cannot expire a pass with status '{Status}'.");

        Status = VisitorPassStatus.Expired;
        MarkAsUpdated(expiredByUserId);
    }

    /// <summary>
    /// Cancels the visitor pass (by resident before visitor arrival).
    /// </summary>
    public void Cancel(Guid cancelledByUserId)
    {
        if (Status == VisitorPassStatus.CheckedIn || Status == VisitorPassStatus.CheckedOut)
            throw new InvalidOperationException($"Cannot cancel a pass with status '{Status}'.");

        if (Status == VisitorPassStatus.Cancelled)
            throw new InvalidOperationException("Pass is already cancelled.");

        Status = VisitorPassStatus.Cancelled;
        MarkAsUpdated(cancelledByUserId);
    }

    /// <summary>
    /// Updates visitor details (only allowed before check-in).
    /// </summary>
    public void UpdateVisitorDetails(
        string visitorName,
        string? visitorPhone,
        string? visitorIdType,
        string? visitorIdNumber,
        string? vehicleNumber,
        string? vehicleType,
        string? notes,
        Guid updatedBy)
    {
        if (Status == VisitorPassStatus.CheckedIn || Status == VisitorPassStatus.CheckedOut)
            throw new InvalidOperationException("Cannot update visitor details after check-in.");

        if (string.IsNullOrWhiteSpace(visitorName))
            throw new ArgumentException("Visitor name is required.", nameof(visitorName));

        VisitorName = visitorName;
        VisitorPhone = visitorPhone;
        VisitorIdType = visitorIdType;
        VisitorIdNumber = visitorIdNumber;
        VehicleNumber = vehicleNumber;
        VehicleType = vehicleType;
        Notes = notes;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Checks if the pass is valid for check-in.
    /// </summary>
    public bool IsValidForCheckIn()
    {
        if (Status != VisitorPassStatus.PreRegistered && Status != VisitorPassStatus.Approved)
            return false;

        if (ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt.Value)
            return false;

        if (ExpectedFrom.HasValue && ExpectedTo.HasValue)
        {
            var now = DateTime.UtcNow;
            if (now < ExpectedFrom.Value || now > ExpectedTo.Value)
                return false;
        }

        return true;
    }
}
