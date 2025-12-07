namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Source/channel from which a maintenance request was submitted.
/// Maps to DBML: Enum MaintenanceSource
/// </summary>
public enum MaintenanceSource
{
    MobileApp,
    AdminPortal,
    SecurityDesk,
    Other
}
