namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of a maintenance request ticket.
/// Maps to DBML: Enum MaintenanceStatus
/// </summary>
public enum MaintenanceStatus
{
    New,
    Assigned,
    InProgress,
    WaitingForResident,
    Completed,
    Rejected,
    Cancelled
}
