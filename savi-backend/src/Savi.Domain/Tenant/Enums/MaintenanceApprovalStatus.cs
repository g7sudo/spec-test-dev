namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Status of owner approval for maintenance cost.
/// Maps to DBML: Enum MaintenanceApprovalStatus
/// </summary>
public enum MaintenanceApprovalStatus
{
    NotRequired,
    Pending,
    Approved,
    Rejected,
    Cancelled
}
