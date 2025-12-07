using Savi.Domain.Tenant.Enums;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Dtos;

/// <summary>
/// DTO for maintenance request detail (line item).
/// </summary>
public record MaintenanceRequestDetailDto
{
    public Guid Id { get; init; }
    public Guid MaintenanceRequestId { get; init; }
    public MaintenanceDetailType LineType { get; init; }
    public string Description { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public string? UnitOfMeasure { get; init; }
    public decimal? EstimatedUnitPrice { get; init; }
    public decimal? EstimatedTotalPrice { get; init; }
    public bool IsBillable { get; init; }
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
}
