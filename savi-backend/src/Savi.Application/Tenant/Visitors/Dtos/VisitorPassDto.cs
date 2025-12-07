using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Visitors.Dtos;

/// <summary>
/// Full DTO for visitor pass details.
/// </summary>
public record VisitorPassDto
{
    public Guid Id { get; init; }
    public Guid UnitId { get; init; }
    public string? UnitNumber { get; init; }
    public string? BlockName { get; init; }
    public VisitorType VisitType { get; init; }
    public VisitorSource Source { get; init; }
    public string? AccessCode { get; init; }
    public Guid? RequestedForUserId { get; init; }
    public string? RequestedForUserName { get; init; }
    public string VisitorName { get; init; } = string.Empty;
    public string? VisitorPhone { get; init; }
    public string? VisitorIdType { get; init; }
    public string? VisitorIdNumber { get; init; }
    public string? VehicleNumber { get; init; }
    public string? VehicleType { get; init; }
    public string? DeliveryProvider { get; init; }
    public string? Notes { get; init; }
    public DateTime? ExpectedFrom { get; init; }
    public DateTime? ExpectedTo { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime? CheckInAt { get; init; }
    public DateTime? CheckOutAt { get; init; }
    public Guid? CheckInByUserId { get; init; }
    public string? CheckInByUserName { get; init; }
    public Guid? CheckOutByUserId { get; init; }
    public string? CheckOutByUserName { get; init; }
    public VisitorPassStatus Status { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public string? ApprovedByUserName { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public Guid? RejectedByUserId { get; init; }
    public string? RejectedByUserName { get; init; }
    public DateTime? RejectedAt { get; init; }
    public string? RejectedReason { get; init; }
    public bool NotifyVisitorAtGate { get; init; }
    public DateTime CreatedAt { get; init; }
    public Guid? CreatedBy { get; init; }
    public string? CreatedByUserName { get; init; }
}

/// <summary>
/// Summary DTO for visitor pass list views.
/// </summary>
public record VisitorPassSummaryDto
{
    public Guid Id { get; init; }
    public string? UnitNumber { get; init; }
    public string? BlockName { get; init; }
    public VisitorType VisitType { get; init; }
    public VisitorSource Source { get; init; }
    public string? AccessCode { get; init; }
    public string VisitorName { get; init; } = string.Empty;
    public string? VisitorPhone { get; init; }
    public string? DeliveryProvider { get; init; }
    public DateTime? ExpectedFrom { get; init; }
    public DateTime? ExpectedTo { get; init; }
    public DateTime? CheckInAt { get; init; }
    public DateTime? CheckOutAt { get; init; }
    public VisitorPassStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
}
