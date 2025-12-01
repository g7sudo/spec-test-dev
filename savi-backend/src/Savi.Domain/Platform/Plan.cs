using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Commercial plan tier with core limits and features.
/// 
/// Plans define rate limiting, feature flags, and other tenant-level restrictions.
/// </summary>
public class Plan : BaseEntity
{
    /// <summary>
    /// Unique plan code (e.g., "BASIC", "STANDARD", "PREMIUM").
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Display name for the plan.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Description of the plan.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Maximum API requests per minute for tenants on this plan.
    /// Used by per-tenant rate limiting.
    /// </summary>
    public int MaxRequestsPerMinute { get; private set; } = 100;

    /// <summary>
    /// Default marketplace listing lifetime in days.
    /// </summary>
    public int DefaultListingExpiryDays { get; private set; } = 30;

    /// <summary>
    /// Whether marketplace feature is enabled for this plan.
    /// </summary>
    public bool IsMarketplaceEnabled { get; private set; } = true;

    /// <summary>
    /// Whether cross-community marketplace is enabled.
    /// </summary>
    public bool IsCrossCommunityMarketplaceEnabled { get; private set; }

    // Navigation properties
    private readonly List<PlanFeature> _features = new();
    public IReadOnlyCollection<PlanFeature> Features => _features.AsReadOnly();

    private readonly List<TenantPlan> _tenantPlans = new();
    public IReadOnlyCollection<TenantPlan> TenantPlans => _tenantPlans.AsReadOnly();

    // Private constructor for EF
    private Plan() { }

    /// <summary>
    /// Creates a new plan.
    /// </summary>
    public static Plan Create(
        string code,
        string name,
        string? description = null,
        int maxRequestsPerMinute = 100,
        int defaultListingExpiryDays = 30,
        bool isMarketplaceEnabled = true,
        bool isCrossCommunityMarketplaceEnabled = false,
        Guid? createdBy = null)
    {
        var plan = new Plan
        {
            Code = code.ToUpperInvariant().Trim(),
            Name = name.Trim(),
            Description = description,
            MaxRequestsPerMinute = maxRequestsPerMinute,
            DefaultListingExpiryDays = defaultListingExpiryDays,
            IsMarketplaceEnabled = isMarketplaceEnabled,
            IsCrossCommunityMarketplaceEnabled = isCrossCommunityMarketplaceEnabled
        };

        plan.SetCreatedBy(createdBy);
        return plan;
    }

    /// <summary>
    /// Updates the plan's basic information.
    /// </summary>
    public void Update(
        string name,
        string? description,
        int maxRequestsPerMinute,
        int defaultListingExpiryDays,
        bool isMarketplaceEnabled,
        bool isCrossCommunityMarketplaceEnabled,
        Guid? updatedBy = null)
    {
        Name = name.Trim();
        Description = description;
        MaxRequestsPerMinute = maxRequestsPerMinute;
        DefaultListingExpiryDays = defaultListingExpiryDays;
        IsMarketplaceEnabled = isMarketplaceEnabled;
        IsCrossCommunityMarketplaceEnabled = isCrossCommunityMarketplaceEnabled;
        MarkAsUpdated(updatedBy);
    }
}

