namespace Savi.Application.Tenant.Auth.Queries.GetMyTenantAuth;

/// <summary>
/// Response DTO for GET /tenant/auth/me endpoint.
/// Contains user identity, tenant context, and tenant-specific permissions.
/// </summary>
public sealed record TenantAuthMeResponseDto
{
    /// <summary>
    /// Platform user ID.
    /// </summary>
    public Guid UserId { get; init; }

    /// <summary>
    /// Tenant user ID (if user is a staff member in this tenant).
    /// </summary>
    public Guid? TenantUserId { get; init; }

    /// <summary>
    /// Community user ID (if user is a resident in this tenant).
    /// </summary>
    public Guid? CommunityUserId { get; init; }

    /// <summary>
    /// User's display name.
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
    /// Current tenant context.
    /// </summary>
    public TenantContextDto Tenant { get; init; } = null!;

    /// <summary>
    /// User's roles in this tenant.
    /// </summary>
    public IReadOnlyCollection<string> Roles { get; init; } = Array.Empty<string>();

    /// <summary>
    /// User's leases in this tenant (for residents).
    /// </summary>
    public IReadOnlyCollection<UserLeaseDto> Leases { get; init; } = Array.Empty<UserLeaseDto>();

    /// <summary>
    /// Flat dictionary of permission keys for this tenant.
    /// Key = permission code, Value = true if granted.
    /// </summary>
    public IReadOnlyDictionary<string, bool> Permissions { get; init; } = new Dictionary<string, bool>();
}

/// <summary>
/// DTO for current tenant context.
/// </summary>
public sealed record TenantContextDto
{
    /// <summary>
    /// Tenant ID.
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// Tenant display name.
    /// </summary>
    public string TenantName { get; init; } = string.Empty;
}

/// <summary>
/// DTO for a user's lease information.
/// </summary>
public sealed record UserLeaseDto
{
    /// <summary>
    /// Lease ID.
    /// </summary>
    public Guid LeaseId { get; init; }

    /// <summary>
    /// Unit ID.
    /// </summary>
    public Guid UnitId { get; init; }

    /// <summary>
    /// Unit label (e.g., "Tower A-A0101").
    /// </summary>
    public string UnitLabel { get; init; } = string.Empty;

    /// <summary>
    /// User's role on this lease (PrimaryResident, CoResident).
    /// </summary>
    public string Role { get; init; } = string.Empty;

    /// <summary>
    /// Whether this is the primary lease party.
    /// </summary>
    public bool IsPrimary { get; init; }

    /// <summary>
    /// Lease status.
    /// </summary>
    public string Status { get; init; } = string.Empty;
}
