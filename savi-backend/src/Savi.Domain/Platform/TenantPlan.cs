using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Tracks which plan a tenant is on and the effective period.
/// 
/// Supports plan history by having multiple records with different validity periods.
/// Only one record should have IsCurrent = true at any time.
/// </summary>
public class TenantPlan : BaseEntity
{
    /// <summary>
    /// The tenant.
    /// </summary>
    public Guid TenantId { get; private set; }
    public Tenant? Tenant { get; private set; }

    /// <summary>
    /// The plan assigned to the tenant.
    /// </summary>
    public Guid PlanId { get; private set; }
    public Plan? Plan { get; private set; }

    /// <summary>
    /// When this plan assignment starts.
    /// </summary>
    public DateTime StartsAt { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// When this plan assignment ends (null = ongoing).
    /// </summary>
    public DateTime? EndsAt { get; private set; }

    /// <summary>
    /// Whether this is the currently active plan for the tenant.
    /// </summary>
    public bool IsCurrent { get; private set; } = true;

    // Private constructor for EF
    private TenantPlan() { }

    /// <summary>
    /// Creates a new tenant plan assignment.
    /// </summary>
    public static TenantPlan Create(
        Guid tenantId,
        Guid planId,
        DateTime? startsAt = null,
        Guid? createdBy = null)
    {
        var tenantPlan = new TenantPlan
        {
            TenantId = tenantId,
            PlanId = planId,
            StartsAt = startsAt ?? DateTime.UtcNow,
            IsCurrent = true
        };

        tenantPlan.SetCreatedBy(createdBy);
        return tenantPlan;
    }

    /// <summary>
    /// Ends this plan assignment (when switching to a new plan).
    /// </summary>
    public void End(DateTime? endsAt = null, Guid? updatedBy = null)
    {
        EndsAt = endsAt ?? DateTime.UtcNow;
        IsCurrent = false;
        MarkAsUpdated(updatedBy);
    }
}

