using Savi.Domain.Common;

namespace Savi.Domain.Platform;

/// <summary>
/// Auditing for key platform-level changes.
/// 
/// Tracks changes to entities like Tenant, Plan, PlatformUser, etc.
/// Can be populated manually or via Audit.NET integration.
/// </summary>
public class PlatformAuditLog : BaseEntity
{
    /// <summary>
    /// When the audited action occurred.
    /// </summary>
    public DateTime Timestamp { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// The platform user who performed the action (if known).
    /// </summary>
    public Guid? PlatformUserId { get; private set; }
    public PlatformUser? PlatformUser { get; private set; }

    /// <summary>
    /// The tenant context in which the action occurred (if applicable).
    /// </summary>
    public Guid? TenantId { get; private set; }
    public Tenant? Tenant { get; private set; }

    /// <summary>
    /// High-level action name (e.g., TENANT_CREATED, PLAN_CHANGED, USER_ROLE_ASSIGNED).
    /// </summary>
    public string Action { get; private set; } = string.Empty;

    /// <summary>
    /// The type of entity affected (e.g., Tenant, Plan, PlatformUser).
    /// </summary>
    public string EntityType { get; private set; } = string.Empty;

    /// <summary>
    /// The ID of the affected entity (string to allow UUID or other identifiers).
    /// </summary>
    public string EntityId { get; private set; } = string.Empty;

    /// <summary>
    /// JSON representation of the entity's previous state (for updates/deletes).
    /// </summary>
    public string? OldValues { get; private set; }

    /// <summary>
    /// JSON representation of the entity's new state (for creates/updates).
    /// </summary>
    public string? NewValues { get; private set; }

    /// <summary>
    /// Correlation ID to trace across logs/requests.
    /// </summary>
    public string? CorrelationId { get; private set; }

    // Private constructor for EF
    private PlatformAuditLog() { }

    /// <summary>
    /// Creates a new audit log entry.
    /// </summary>
    public static PlatformAuditLog Create(
        string action,
        string entityType,
        string entityId,
        Guid? platformUserId = null,
        Guid? tenantId = null,
        string? oldValues = null,
        string? newValues = null,
        string? correlationId = null)
    {
        var log = new PlatformAuditLog
        {
            Timestamp = DateTime.UtcNow,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            PlatformUserId = platformUserId,
            TenantId = tenantId,
            OldValues = oldValues,
            NewValues = newValues,
            CorrelationId = correlationId
        };

        log.SetCreatedBy(platformUserId);
        return log;
    }
}

/// <summary>
/// Common audit actions for platform-level changes.
/// </summary>
public static class PlatformAuditActions
{
    // Tenant actions
    public const string TenantCreated = "TENANT_CREATED";
    public const string TenantUpdated = "TENANT_UPDATED";
    public const string TenantSuspended = "TENANT_SUSPENDED";
    public const string TenantArchived = "TENANT_ARCHIVED";
    public const string TenantReactivated = "TENANT_REACTIVATED";

    // User actions
    public const string UserCreated = "USER_CREATED";
    public const string UserUpdated = "USER_UPDATED";
    public const string UserRoleAssigned = "USER_ROLE_ASSIGNED";
    public const string UserRoleRemoved = "USER_ROLE_REMOVED";

    // Membership actions
    public const string MembershipInvited = "MEMBERSHIP_INVITED";
    public const string MembershipAccepted = "MEMBERSHIP_ACCEPTED";
    public const string MembershipSuspended = "MEMBERSHIP_SUSPENDED";

    // Plan actions
    public const string PlanAssigned = "PLAN_ASSIGNED";
    public const string PlanChanged = "PLAN_CHANGED";
}

