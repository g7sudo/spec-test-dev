using Savi.Domain.Common;

namespace Savi.Domain.Tenant;

/// <summary>
/// Lookup for maintenance categories used for routing and reporting.
/// Maps to DBML: Table MaintenanceCategory
/// </summary>
public class MaintenanceCategory : BaseEntity
{
    /// <summary>
    /// Name of the category (e.g., Electrical, Plumbing, HVAC, Lift).
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Short code for the category (e.g., ELEC, PLUMB).
    /// </summary>
    public string? Code { get; private set; }

    /// <summary>
    /// Description of the category.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Display order for sorting.
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// Whether this is the default category.
    /// </summary>
    public bool IsDefault { get; private set; }

    // EF Core constructor
    private MaintenanceCategory() { }

    /// <summary>
    /// Creates a new maintenance category.
    /// </summary>
    public static MaintenanceCategory Create(
        string name,
        string? code,
        string? description,
        int displayOrder,
        bool isDefault,
        Guid createdBy)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name is required.", nameof(name));

        var category = new MaintenanceCategory
        {
            Name = name,
            Code = code,
            Description = description,
            DisplayOrder = displayOrder,
            IsDefault = isDefault
        };

        category.SetCreatedBy(createdBy);
        return category;
    }

    /// <summary>
    /// Updates the category details.
    /// </summary>
    public void Update(
        string name,
        string? code,
        string? description,
        int displayOrder,
        bool isDefault,
        Guid updatedBy)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name is required.", nameof(name));

        Name = name;
        Code = code;
        Description = description;
        DisplayOrder = displayOrder;
        IsDefault = isDefault;

        MarkAsUpdated(updatedBy);
    }
}
