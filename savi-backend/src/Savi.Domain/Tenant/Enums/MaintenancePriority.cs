namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Priority level of a maintenance request.
/// Maps to DBML: Enum MaintenancePriority
/// </summary>
public enum MaintenancePriority
{
    Low,
    Normal,
    High,
    Critical
}
