using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Extensible key-value feature flags per plan.
/// 
/// Examples: MAX_UNITS, MAX_AMENITIES, MAX_USERS, etc.
/// </summary>
public class PlanFeature : BaseEntity
{
    /// <summary>
    /// The plan this feature belongs to.
    /// </summary>
    public Guid PlanId { get; private set; }
    public Plan? Plan { get; private set; }

    /// <summary>
    /// Feature key (e.g., "MAX_UNITS", "MAX_AMENITIES").
    /// </summary>
    public string Key { get; private set; } = string.Empty;

    /// <summary>
    /// Feature value (string/JSON depending on the feature).
    /// </summary>
    public string Value { get; private set; } = string.Empty;

    // Private constructor for EF
    private PlanFeature() { }

    /// <summary>
    /// Creates a new plan feature.
    /// </summary>
    public static PlanFeature Create(
        Guid planId,
        string key,
        string value,
        Guid? createdBy = null)
    {
        var feature = new PlanFeature
        {
            PlanId = planId,
            Key = key.ToUpperInvariant().Trim(),
            Value = value
        };

        feature.SetCreatedBy(createdBy);
        return feature;
    }

    /// <summary>
    /// Updates the feature value.
    /// </summary>
    public void UpdateValue(string value, Guid? updatedBy = null)
    {
        Value = value;
        MarkAsUpdated(updatedBy);
    }
}

