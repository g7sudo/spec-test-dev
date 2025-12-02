namespace Savi.Application.Platform.Profile.Dtos;

/// <summary>
/// Response DTO for GET /auth/me endpoint.
/// 
/// Contains user identity, tenant memberships for dropdown,
/// current scope context, and context-aware permissions.
/// </summary>
public sealed record AuthMeResponseDto
{
    /// <summary>
    /// Platform user ID.
    /// </summary>
    public Guid UserId { get; init; }

    /// <summary>
    /// User's display name (full name).
    /// </summary>
    public string? DisplayName { get; init; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// User's phone number.
    /// </summary>
    public string? PhoneNumber { get; init; }

    /// <summary>
    /// Global/platform roles assigned to this user (e.g., PLATFORM_ADMIN).
    /// Empty array if user has no platform roles.
    /// </summary>
    public IReadOnlyCollection<string> GlobalRoles { get; init; } = Array.Empty<string>();

    /// <summary>
    /// List of all tenants the user has access to (for scope dropdown).
    /// </summary>
    public IReadOnlyCollection<TenantMembershipItemDto> TenantMemberships { get; init; } = Array.Empty<TenantMembershipItemDto>();

    /// <summary>
    /// Current scope context based on X-Tenant-Id header.
    /// Null if no tenant header provided (platform-only context).
    /// </summary>
    public CurrentScopeDto? CurrentScope { get; init; }

    /// <summary>
    /// Flat dictionary of permission keys for current scope.
    /// Contains platform permissions + tenant permissions (if tenant selected).
    /// Key = permission code, Value = true if granted.
    /// </summary>
    public IReadOnlyDictionary<string, bool> Permissions { get; init; } = new Dictionary<string, bool>();
}

/// <summary>
/// DTO for a tenant membership (used in dropdown).
/// </summary>
public sealed record TenantMembershipItemDto
{
    /// <summary>
    /// Tenant ID.
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// Tenant slug/code for URL routing.
    /// </summary>
    public string TenantSlug { get; init; } = string.Empty;

    /// <summary>
    /// Tenant display name.
    /// </summary>
    public string TenantName { get; init; } = string.Empty;

    /// <summary>
    /// User's roles in this tenant (e.g., COMMUNITY_ADMIN, RESIDENT).
    /// </summary>
    public IReadOnlyCollection<string> Roles { get; init; } = Array.Empty<string>();
}

/// <summary>
/// DTO for current scope context.
/// </summary>
public sealed record CurrentScopeDto
{
    /// <summary>
    /// Scope type: "platform" or "tenant".
    /// </summary>
    public string Type { get; init; } = "platform";

    /// <summary>
    /// Tenant ID if scope is tenant, null otherwise.
    /// </summary>
    public Guid? TenantId { get; init; }

    /// <summary>
    /// Tenant slug if scope is tenant, null otherwise.
    /// </summary>
    public string? TenantSlug { get; init; }

    /// <summary>
    /// Tenant name if scope is tenant, null otherwise.
    /// </summary>
    public string? TenantName { get; init; }
}

