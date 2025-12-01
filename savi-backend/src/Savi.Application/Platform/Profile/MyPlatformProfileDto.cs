namespace Savi.Application.Platform.Profile;

/// <summary>
/// DTO for the current user's platform profile.
/// Includes basic info and list of tenants they belong to.
/// </summary>
public sealed record MyPlatformProfileDto
{
    /// <summary>
    /// Platform user ID.
    /// </summary>
    public Guid UserId { get; init; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// User's full name.
    /// </summary>
    public string? FullName { get; init; }

    /// <summary>
    /// User's phone number.
    /// </summary>
    public string? PhoneNumber { get; init; }

    /// <summary>
    /// Platform roles assigned to this user.
    /// </summary>
    public IReadOnlyCollection<string> PlatformRoles { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Tenants (communities) this user belongs to.
    /// </summary>
    public IReadOnlyCollection<TenantMembershipDto> Tenants { get; init; } = Array.Empty<TenantMembershipDto>();
}

/// <summary>
/// DTO for a tenant membership.
/// </summary>
public sealed record TenantMembershipDto
{
    /// <summary>
    /// Tenant ID.
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// Tenant name.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Tenant code/slug.
    /// </summary>
    public string? Code { get; init; }

    /// <summary>
    /// Membership status (Invited, Active, Suspended).
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>
    /// High-level role in this tenant (e.g., COMMUNITY_ADMIN, RESIDENT).
    /// </summary>
    public string? RoleCode { get; init; }
}

