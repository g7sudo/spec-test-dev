using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Many-to-many link between Campaign and Tenant.
/// Defines which tenants (communities) a campaign runs in.
/// </summary>
public class CampaignTargetTenant : BaseEntity
{
    /// <summary>
    /// The campaign this target belongs to.
    /// </summary>
    public Guid CampaignId { get; private set; }

    /// <summary>
    /// The tenant (community) where this campaign will show ads.
    /// </summary>
    public Guid TenantId { get; private set; }

    // Navigation properties
    public Campaign? Campaign { get; private set; }
    public Tenant? Tenant { get; private set; }

    // Private constructor for EF
    private CampaignTargetTenant() { }

    /// <summary>
    /// Creates a new campaign target tenant link.
    /// </summary>
    public static CampaignTargetTenant Create(
        Guid campaignId,
        Guid tenantId,
        Guid? createdBy = null)
    {
        var target = new CampaignTargetTenant
        {
            CampaignId = campaignId,
            TenantId = tenantId
        };

        target.SetCreatedBy(createdBy);
        return target;
    }
}
