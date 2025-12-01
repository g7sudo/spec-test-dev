using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.MultiTenancy;

namespace Savi.Infrastructure.Persistence.TenantDb;

/// <summary>
/// Creates/updates CommunityUser + role assignments when invitations are accepted.
/// </summary>
public sealed class TenantAdminOnboardingService : ITenantAdminOnboardingService
{
    private readonly ITenantDbContextFactory _tenantDbContextFactory;
    private readonly ILogger<TenantAdminOnboardingService> _logger;

    public TenantAdminOnboardingService(
        ITenantDbContextFactory tenantDbContextFactory,
        ILogger<TenantAdminOnboardingService> logger)
    {
        _tenantDbContextFactory = tenantDbContextFactory;
        _logger = logger;
    }

    public async Task EnsureCommunityAdminAsync(
        Guid tenantId,
        Guid platformUserId,
        string tenantRoleCode,
        string? preferredName,
        CancellationToken cancellationToken = default)
    {
        var context = await _tenantDbContextFactory.CreateAsync(tenantId, cancellationToken)
            ?? throw new InvalidOperationException("Failed to create tenant DbContext.");

        await using var tenantDbContext = context as TenantDbContext
            ?? throw new InvalidOperationException("TenantDbContextFactory returned unexpected context type.");

        var communityUser = await tenantDbContext.CommunityUsers
            .FirstOrDefaultAsync(cu => cu.PlatformUserId == platformUserId, cancellationToken);

        if (communityUser == null)
        {
            // Party entity is not implemented yet, so use a placeholder GUID.
            communityUser = CommunityUser.Create(
                partyId: Guid.NewGuid(),
                platformUserId: platformUserId,
                preferredName: preferredName);

            tenantDbContext.CommunityUsers.Add(communityUser);
        }
        else if (!string.IsNullOrWhiteSpace(preferredName) &&
                 string.IsNullOrWhiteSpace(communityUser.PreferredName))
        {
            communityUser.UpdatePreferences(
                preferredName,
                communityUser.Timezone,
                communityUser.Locale);
        }

        tenantRoleCode = tenantRoleCode.ToUpperInvariant();

        var roleGroup = await tenantDbContext.RoleGroups
            .FirstOrDefaultAsync(rg => rg.Code == tenantRoleCode, cancellationToken);

        if (roleGroup == null)
        {
            _logger.LogWarning(
                "RoleGroup {RoleCode} not found for tenant {TenantId}.",
                tenantRoleCode,
                tenantId);
            throw new InvalidOperationException($"RoleGroup {tenantRoleCode} is not configured for tenant {tenantId}.");
        }

        var alreadyAssigned = await tenantDbContext.CommunityUserRoleGroups
            .AnyAsync(
                rg => rg.CommunityUserId == communityUser.Id && rg.RoleGroupId == roleGroup.Id,
                cancellationToken);

        if (!alreadyAssigned)
        {
            var assignment = CommunityUserRoleGroup.Create(
                communityUser.Id,
                roleGroup.Id,
                isPrimary: true);

            tenantDbContext.CommunityUserRoleGroups.Add(assignment);
        }

        await tenantDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Ensured tenant admin CommunityUser {CommunityUserId} for platform user {PlatformUserId} in tenant {TenantId}.",
            communityUser.Id,
            platformUserId,
            tenantId);
    }
}

