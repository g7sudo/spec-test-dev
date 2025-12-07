using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Maintenance.Requests.Dtos;

/// <summary>
/// Full DTO for maintenance request details.
/// </summary>
public record MaintenanceRequestDto
{
    public Guid Id { get; init; }
    public string TicketNumber { get; init; } = string.Empty;
    public Guid UnitId { get; init; }
    public string? UnitNumber { get; init; }
    public Guid CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public Guid RequestedForPartyId { get; init; }
    public string? RequestedForPartyName { get; init; }
    public Guid RequestedByUserId { get; init; }
    public string? RequestedByUserName { get; init; }
    public Guid? AssignedToUserId { get; init; }
    public string? AssignedToUserName { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public MaintenanceStatus Status { get; init; }
    public MaintenancePriority Priority { get; init; }
    public MaintenanceSource Source { get; init; }
    public DateTime RequestedAt { get; init; }
    public DateTime? DueBy { get; init; }
    public DateTime? AssignedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime? RejectedAt { get; init; }
    public string? RejectionReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public Guid? CancelledByUserId { get; init; }
    public string? CancellationReason { get; init; }
    public string? AssessmentSummary { get; init; }
    public DateTime? AssessmentCompletedAt { get; init; }
    public Guid? AssessmentByUserId { get; init; }
    public int? ResidentRating { get; init; }
    public string? ResidentFeedback { get; init; }
    public DateTime? RatedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Summary DTO for maintenance request list views.
/// </summary>
public record MaintenanceRequestSummaryDto
{
    public Guid Id { get; init; }
    public string TicketNumber { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public string? CategoryName { get; init; }
    public string Title { get; init; } = string.Empty;
    public MaintenanceStatus Status { get; init; }
    public MaintenancePriority Priority { get; init; }
    public string? AssignedToUserName { get; init; }
    public DateTime RequestedAt { get; init; }
    public DateTime? DueBy { get; init; }
}
