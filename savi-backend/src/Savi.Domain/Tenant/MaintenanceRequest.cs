using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Unit-only maintenance ticket: unit + category + subject (Party) + actor (CommunityUser)
/// + status, assignment, ticket number, and resident review.
/// Maps to DBML: Table MaintenanceRequest
/// </summary>
public class MaintenanceRequest : BaseEntity
{
    // --- Identity in UI
    /// <summary>
    /// Human-readable ticket number per community (e.g., MT-000123).
    /// </summary>
    public string TicketNumber { get; private set; } = string.Empty;

    // --- Unit + category
    /// <summary>
    /// The unit this maintenance request is for.
    /// </summary>
    public Guid UnitId { get; private set; }

    /// <summary>
    /// Category of the maintenance request.
    /// </summary>
    public Guid CategoryId { get; private set; }

    // --- Who the request is for vs who submitted it
    /// <summary>
    /// Resident/owner party this request is for.
    /// </summary>
    public Guid RequestedForPartyId { get; private set; }

    /// <summary>
    /// User who submitted the request (resident or admin).
    /// </summary>
    public Guid RequestedByUserId { get; private set; }

    /// <summary>
    /// Maintenance staff currently responsible for this request.
    /// </summary>
    public Guid? AssignedToUserId { get; private set; }

    // --- Content
    /// <summary>
    /// Short title describing the issue.
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Detailed description of the issue.
    /// </summary>
    public string? Description { get; private set; }

    // --- Workflow
    /// <summary>
    /// Current status of the request.
    /// </summary>
    public MaintenanceStatus Status { get; private set; }

    /// <summary>
    /// Priority level of the request.
    /// </summary>
    public MaintenancePriority Priority { get; private set; }

    /// <summary>
    /// Source/channel from which the request was submitted.
    /// </summary>
    public MaintenanceSource Source { get; private set; }

    /// <summary>
    /// When the request was submitted.
    /// </summary>
    public DateTime RequestedAt { get; private set; }

    /// <summary>
    /// Optional SLA target date.
    /// </summary>
    public DateTime? DueBy { get; private set; }

    /// <summary>
    /// When the request was assigned to a technician.
    /// </summary>
    public DateTime? AssignedAt { get; private set; }

    /// <summary>
    /// When work started on the request.
    /// </summary>
    public DateTime? StartedAt { get; private set; }

    /// <summary>
    /// When the request was completed.
    /// </summary>
    public DateTime? CompletedAt { get; private set; }

    /// <summary>
    /// When the request was rejected.
    /// </summary>
    public DateTime? RejectedAt { get; private set; }

    /// <summary>
    /// Reason for rejection.
    /// </summary>
    public string? RejectionReason { get; private set; }

    /// <summary>
    /// When the request was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; private set; }

    /// <summary>
    /// User who cancelled the request.
    /// </summary>
    public Guid? CancelledByUserId { get; private set; }

    /// <summary>
    /// Reason for cancellation.
    /// </summary>
    public string? CancellationReason { get; private set; }

    // --- Site visit assessment
    /// <summary>
    /// Short summary from site visit assessment.
    /// </summary>
    public string? AssessmentSummary { get; private set; }

    /// <summary>
    /// When the site visit assessment was completed.
    /// </summary>
    public DateTime? AssessmentCompletedAt { get; private set; }

    /// <summary>
    /// Maintenance staff who did the site visit/assessment.
    /// </summary>
    public Guid? AssessmentByUserId { get; private set; }

    // --- Resident review
    /// <summary>
    /// 1-5 rating from resident.
    /// </summary>
    public int? ResidentRating { get; private set; }

    /// <summary>
    /// Feedback text from resident.
    /// </summary>
    public string? ResidentFeedback { get; private set; }

    /// <summary>
    /// When the rating was submitted.
    /// </summary>
    public DateTime? RatedAt { get; private set; }

    // EF Core constructor
    private MaintenanceRequest() { }

    /// <summary>
    /// Creates a new maintenance request.
    /// </summary>
    public static MaintenanceRequest Create(
        string ticketNumber,
        Guid unitId,
        Guid categoryId,
        Guid requestedForPartyId,
        Guid requestedByUserId,
        string title,
        string? description,
        MaintenancePriority priority,
        MaintenanceSource source,
        DateTime? dueBy,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Ticket number is required.", nameof(ticketNumber));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required.", nameof(title));

        var request = new MaintenanceRequest
        {
            TicketNumber = ticketNumber,
            UnitId = unitId,
            CategoryId = categoryId,
            RequestedForPartyId = requestedForPartyId,
            RequestedByUserId = requestedByUserId,
            Title = title,
            Description = description,
            Status = MaintenanceStatus.New,
            Priority = priority,
            Source = source,
            RequestedAt = DateTime.UtcNow,
            DueBy = dueBy
        };

        request.SetCreatedBy(createdBy);
        return request;
    }

    /// <summary>
    /// Updates the request content.
    /// </summary>
    public void UpdateContent(
        string title,
        string? description,
        Guid categoryId,
        MaintenancePriority priority,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required.", nameof(title));

        Title = title;
        Description = description;
        CategoryId = categoryId;
        Priority = priority;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Assigns the request to a technician.
    /// </summary>
    public void Assign(Guid assignedToUserId, Guid updatedBy)
    {
        AssignedToUserId = assignedToUserId;
        AssignedAt = DateTime.UtcNow;

        if (Status == MaintenanceStatus.New)
            Status = MaintenanceStatus.Assigned;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Unassigns the request from the current technician.
    /// </summary>
    public void Unassign(Guid updatedBy)
    {
        AssignedToUserId = null;
        AssignedAt = null;

        if (Status == MaintenanceStatus.Assigned)
            Status = MaintenanceStatus.New;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Starts work on the request.
    /// </summary>
    public void StartWork(Guid updatedBy)
    {
        if (Status != MaintenanceStatus.Assigned)
            throw new InvalidOperationException("Can only start work on an assigned request.");

        Status = MaintenanceStatus.InProgress;
        StartedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Records the site visit assessment.
    /// </summary>
    public void RecordAssessment(
        string assessmentSummary,
        Guid assessmentByUserId,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(assessmentSummary))
            throw new ArgumentException("Assessment summary is required.", nameof(assessmentSummary));

        AssessmentSummary = assessmentSummary;
        AssessmentByUserId = assessmentByUserId;
        AssessmentCompletedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Marks the request as waiting for resident response.
    /// </summary>
    public void WaitForResident(Guid updatedBy)
    {
        Status = MaintenanceStatus.WaitingForResident;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Completes the request.
    /// </summary>
    public void Complete(Guid updatedBy)
    {
        Status = MaintenanceStatus.Completed;
        CompletedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Rejects the request.
    /// </summary>
    public void Reject(string reason, Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required.", nameof(reason));

        Status = MaintenanceStatus.Rejected;
        RejectionReason = reason;
        RejectedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Cancels the request.
    /// </summary>
    public void Cancel(string reason, Guid cancelledByUserId, Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cancellation reason is required.", nameof(reason));

        Status = MaintenanceStatus.Cancelled;
        CancellationReason = reason;
        CancelledByUserId = cancelledByUserId;
        CancelledAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Records the resident's rating and feedback.
    /// </summary>
    public void Rate(int rating, string? feedback, Guid updatedBy)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5.", nameof(rating));

        if (Status != MaintenanceStatus.Completed)
            throw new InvalidOperationException("Can only rate completed requests.");

        if (ResidentRating.HasValue)
            throw new InvalidOperationException("Request has already been rated.");

        ResidentRating = rating;
        ResidentFeedback = feedback;
        RatedAt = DateTime.UtcNow;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Sets the SLA due date.
    /// </summary>
    public void SetDueBy(DateTime? dueBy, Guid updatedBy)
    {
        DueBy = dueBy;
        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Updates the priority.
    /// </summary>
    public void UpdatePriority(MaintenancePriority priority, Guid updatedBy)
    {
        Priority = priority;
        MarkAsUpdated(updatedBy);
    }
}
