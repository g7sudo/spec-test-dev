using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Detailed assessment lines for a maintenance request: service tasks and spare parts with estimated cost.
/// Maps to DBML: Table MaintenanceRequestDetail
/// </summary>
public class MaintenanceRequestDetail : BaseEntity
{
    /// <summary>
    /// The maintenance request this detail belongs to.
    /// </summary>
    public Guid MaintenanceRequestId { get; private set; }

    /// <summary>
    /// Type of line item (Service, SparePart, Other).
    /// </summary>
    public MaintenanceDetailType LineType { get; private set; }

    /// <summary>
    /// What this line is about (e.g., Replace tap cartridge).
    /// </summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// Quantity of items or hours.
    /// </summary>
    public decimal Quantity { get; private set; }

    /// <summary>
    /// Unit of measure (e.g., pcs, hours).
    /// </summary>
    public string? UnitOfMeasure { get; private set; }

    /// <summary>
    /// Estimated price per unit.
    /// </summary>
    public decimal? EstimatedUnitPrice { get; private set; }

    /// <summary>
    /// Estimated total for this line (Quantity * EstimatedUnitPrice).
    /// </summary>
    public decimal? EstimatedTotalPrice { get; private set; }

    /// <summary>
    /// If false, internal work not charged to owner.
    /// </summary>
    public bool IsBillable { get; private set; }

    /// <summary>
    /// Sort order for displaying lines in UI.
    /// </summary>
    public int SortOrder { get; private set; }

    // EF Core constructor
    private MaintenanceRequestDetail() { }

    /// <summary>
    /// Creates a new maintenance request detail line.
    /// </summary>
    public static MaintenanceRequestDetail Create(
        Guid maintenanceRequestId,
        MaintenanceDetailType lineType,
        string description,
        decimal quantity,
        string? unitOfMeasure,
        decimal? estimatedUnitPrice,
        bool isBillable,
        int sortOrder,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required.", nameof(description));

        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive.", nameof(quantity));

        var detail = new MaintenanceRequestDetail
        {
            MaintenanceRequestId = maintenanceRequestId,
            LineType = lineType,
            Description = description,
            Quantity = quantity,
            UnitOfMeasure = unitOfMeasure,
            EstimatedUnitPrice = estimatedUnitPrice,
            EstimatedTotalPrice = estimatedUnitPrice.HasValue ? quantity * estimatedUnitPrice.Value : null,
            IsBillable = isBillable,
            SortOrder = sortOrder
        };

        detail.SetCreatedBy(createdBy);
        return detail;
    }

    /// <summary>
    /// Updates the detail line.
    /// </summary>
    public void Update(
        MaintenanceDetailType lineType,
        string description,
        decimal quantity,
        string? unitOfMeasure,
        decimal? estimatedUnitPrice,
        bool isBillable,
        int sortOrder,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required.", nameof(description));

        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive.", nameof(quantity));

        LineType = lineType;
        Description = description;
        Quantity = quantity;
        UnitOfMeasure = unitOfMeasure;
        EstimatedUnitPrice = estimatedUnitPrice;
        EstimatedTotalPrice = estimatedUnitPrice.HasValue ? quantity * estimatedUnitPrice.Value : null;
        IsBillable = isBillable;
        SortOrder = sortOrder;

        MarkAsUpdated(updatedBy);
    }

    /// <summary>
    /// Recalculates the estimated total price.
    /// </summary>
    public void RecalculateTotal()
    {
        EstimatedTotalPrice = EstimatedUnitPrice.HasValue ? Quantity * EstimatedUnitPrice.Value : null;
    }
}
