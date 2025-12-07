using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Maintenance.Approvals.Dtos;

/// <summary>
/// DTO for maintenance approval.
/// </summary>
public record MaintenanceApprovalDto
{
    public Guid Id { get; init; }
    public Guid MaintenanceRequestId { get; init; }
    public string? TicketNumber { get; init; }
    public MaintenanceApprovalStatus Status { get; init; }
    public decimal? RequestedAmount { get; init; }
    public string? Currency { get; init; }
    public Guid RequestedByUserId { get; init; }
    public string? RequestedByUserName { get; init; }
    public DateTime RequestedAt { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public string? ApprovedByUserName { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public string? RejectionReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public Guid? CancelledByUserId { get; init; }
    public string? CancellationReason { get; init; }
    public MaintenanceOwnerPaymentStatus OwnerPaymentStatus { get; init; }
    public decimal? OwnerPaidAmount { get; init; }
    public DateTime? OwnerPaidAt { get; init; }
    public string? OwnerPaymentReference { get; init; }
    public DateTime CreatedAt { get; init; }
}
