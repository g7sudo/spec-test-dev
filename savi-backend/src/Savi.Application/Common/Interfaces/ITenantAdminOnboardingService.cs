namespace Savi.Application.Common.Interfaces;

/// <summary>
/// Handles tenant-side provisioning when a platform membership becomes active.
/// </summary>
public interface ITenantAdminOnboardingService
{
    /// <summary>
    /// Ensures a CommunityUser exists for the supplied platform user and
    /// assigns the requested tenant role group (COMMUNITY_ADMIN by default).
    /// </summary>
    Task EnsureCommunityAdminAsync(
        Guid tenantId,
        Guid platformUserId,
        string tenantRoleCode,
        string? preferredName,
        CancellationToken cancellationToken = default);
}

