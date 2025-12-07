using Savi.Domain.Common;
using Savi.Domain.Tenant.Enums;

namespace Savi.Domain.Tenant;

/// <summary>
/// Defines the target audience for an announcement.
/// An announcement can have multiple audience entries to target
/// different communities, blocks, units, or role groups.
/// Maps to DBML: Table AnnouncementAudience
/// </summary>
public class AnnouncementAudience : BaseEntity
{
    /// <summary>
    /// Reference to the parent announcement.
    /// </summary>
    public Guid AnnouncementId { get; private set; }

    /// <summary>
    /// Type of target (Community, Block, Unit, RoleGroup).
    /// </summary>
    public AudienceTargetType TargetType { get; private set; }

    /// <summary>
    /// Optional: Target Block ID when TargetType is Block.
    /// </summary>
    public Guid? BlockId { get; private set; }

    /// <summary>
    /// Optional: Target Unit ID when TargetType is Unit.
    /// </summary>
    public Guid? UnitId { get; private set; }

    /// <summary>
    /// Optional: Target RoleGroup ID when TargetType is RoleGroup.
    /// </summary>
    public Guid? RoleGroupId { get; private set; }

    // EF Core constructor
    private AnnouncementAudience() { }

    /// <summary>
    /// Creates an audience targeting the entire community.
    /// </summary>
    public static AnnouncementAudience ForCommunity(Guid announcementId, Guid createdBy)
    {
        var audience = new AnnouncementAudience
        {
            AnnouncementId = announcementId,
            TargetType = AudienceTargetType.Community,
            BlockId = null,
            UnitId = null,
            RoleGroupId = null
        };

        audience.SetCreatedBy(createdBy);
        return audience;
    }

    /// <summary>
    /// Creates an audience targeting a specific block.
    /// </summary>
    public static AnnouncementAudience ForBlock(Guid announcementId, Guid blockId, Guid createdBy)
    {
        if (blockId == Guid.Empty)
            throw new ArgumentException("Block ID is required.", nameof(blockId));

        var audience = new AnnouncementAudience
        {
            AnnouncementId = announcementId,
            TargetType = AudienceTargetType.Block,
            BlockId = blockId,
            UnitId = null,
            RoleGroupId = null
        };

        audience.SetCreatedBy(createdBy);
        return audience;
    }

    /// <summary>
    /// Creates an audience targeting a specific unit.
    /// </summary>
    public static AnnouncementAudience ForUnit(Guid announcementId, Guid unitId, Guid createdBy)
    {
        if (unitId == Guid.Empty)
            throw new ArgumentException("Unit ID is required.", nameof(unitId));

        var audience = new AnnouncementAudience
        {
            AnnouncementId = announcementId,
            TargetType = AudienceTargetType.Unit,
            BlockId = null,
            UnitId = unitId,
            RoleGroupId = null
        };

        audience.SetCreatedBy(createdBy);
        return audience;
    }

    /// <summary>
    /// Creates an audience targeting a specific role group.
    /// </summary>
    public static AnnouncementAudience ForRoleGroup(Guid announcementId, Guid roleGroupId, Guid createdBy)
    {
        if (roleGroupId == Guid.Empty)
            throw new ArgumentException("Role Group ID is required.", nameof(roleGroupId));

        var audience = new AnnouncementAudience
        {
            AnnouncementId = announcementId,
            TargetType = AudienceTargetType.RoleGroup,
            BlockId = null,
            UnitId = null,
            RoleGroupId = roleGroupId
        };

        audience.SetCreatedBy(createdBy);
        return audience;
    }
}
