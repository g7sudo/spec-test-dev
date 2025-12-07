namespace Savi.Domain.Tenant.Enums;

/// <summary>
/// Type of maintenance request detail line item.
/// Maps to DBML: Enum MaintenanceDetailType
/// </summary>
public enum MaintenanceDetailType
{
    /// <summary>
    /// Labour, inspection, work tasks.
    /// </summary>
    Service,

    /// <summary>
    /// Parts, materials, consumables.
    /// </summary>
    SparePart,

    /// <summary>
    /// Miscellaneous charges, fees.
    /// </summary>
    Other
}
