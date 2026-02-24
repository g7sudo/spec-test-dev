using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Profile.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Profile.Queries.GetMyPlatformProfile;

/// <summary>
/// Handler for GetMyPlatformProfileQuery.
/// 
/// Loads the current user's profile, tenant memberships, and context-aware permissions.
/// Permissions returned depend on the current scope (X-Tenant-Id header):
/// - Platform scope: Returns platform permissions only
/// - Tenant scope: Returns platform + selected tenant permissions
/// </summary>
public sealed class GetMyPlatformProfileQueryHandler
    : IRequestHandler<GetMyPlatformProfileQuery, Result<AuthMeResponseDto>>
{
    private readonly ICurrentUser _currentUser;
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<GetMyPlatformProfileQueryHandler> _logger;

    public GetMyPlatformProfileQueryHandler(
        ICurrentUser currentUser,
        IPlatformDbContext platformDbContext,
        ILogger<GetMyPlatformProfileQueryHandler> logger)
    {
        _currentUser = currentUser;
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public Task<Result<AuthMeResponseDto>> Handle(
        GetMyPlatformProfileQuery request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Getting auth/me for user {UserId}, tenant context: {TenantId}",
            _currentUser.UserId,
            _currentUser.CurrentTenantId);

        // ─────────────────────────────────────────────────────────────────
        // 1. Get user details from PlatformDB
        // ─────────────────────────────────────────────────────────────────
        var users = _platformDbContext.PlatformUsers
            .AsNoTracking()
            .Where(u => u.Id == _currentUser.UserId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber
            })
            .Take(1)
            .ToList();

        var user = users.FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("PlatformUser not found for UserId {UserId}", _currentUser.UserId);
            return Task.FromResult(Result.Failure<AuthMeResponseDto>("User not found."));
        }

        // ─────────────────────────────────────────────────────────────────
        // 2. Get platform roles from database
        // ─────────────────────────────────────────────────────────────────
        var platformRoles = _platformDbContext.PlatformUserRoles
            .AsNoTracking()
            .Where(ur => ur.PlatformUserId == _currentUser.UserId && ur.IsActive)
            .Join(
                _platformDbContext.PlatformRoles.AsNoTracking().Where(r => r.IsActive),
                ur => ur.PlatformRoleId,
                r => r.Id,
                (ur, r) => r.Code)
            .ToList();

        // ─────────────────────────────────────────────────────────────────
        // 3. Get tenant memberships (for scope dropdown)
        // ─────────────────────────────────────────────────────────────────
        // Only return accepted memberships — Invited/Suspended should not appear in tenant dropdown
        var memberships = _platformDbContext.UserTenantMemberships
            .AsNoTracking()
            .Where(m => m.PlatformUserId == _currentUser.UserId
                        && m.IsActive
                        && m.Status == MembershipStatus.Active)
            .Join(
                _platformDbContext.Tenants.AsNoTracking().Where(t => t.IsActive),
                m => m.TenantId,
                t => t.Id,
                (m, t) => new TenantMembershipItemDto
                {
                    TenantId = t.Id,
                    TenantSlug = t.Code ?? t.Id.ToString(),
                    TenantName = t.Name,
                    // TenantRoleCode from membership - wrap in array for frontend
                    Roles = string.IsNullOrEmpty(m.TenantRoleCode)
                        ? Array.Empty<string>()
                        : new[] { m.TenantRoleCode }
                })
            .ToList();

        // ─────────────────────────────────────────────────────────────────
        // 4. Build current scope context (based on X-Tenant-Id header)
        // ─────────────────────────────────────────────────────────────────
        CurrentScopeDto? currentScope = null;

        if (_currentUser.CurrentTenantId.HasValue)
        {
            // Tenant scope - find the tenant details
            var selectedTenant = memberships.FirstOrDefault(
                m => m.TenantId == _currentUser.CurrentTenantId.Value);

            if (selectedTenant != null)
            {
                currentScope = new CurrentScopeDto
                {
                    Type = "tenant",
                    TenantId = selectedTenant.TenantId,
                    TenantSlug = selectedTenant.TenantSlug,
                    TenantName = selectedTenant.TenantName
                };
            }
            else
            {
                // User requested a tenant they don't have access to
                _logger.LogWarning(
                    "User {UserId} requested tenant {TenantId} but has no membership",
                    _currentUser.UserId,
                    _currentUser.CurrentTenantId);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Build permissions dictionary (context-aware)
        // ─────────────────────────────────────────────────────────────────
        var permissions = BuildPermissionsDictionary(currentScope != null);

        // ─────────────────────────────────────────────────────────────────
        // 6. Construct final response
        // ─────────────────────────────────────────────────────────────────
        var response = new AuthMeResponseDto
        {
            UserId = user.Id,
            DisplayName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            GlobalRoles = platformRoles,
            TenantMemberships = memberships,
            CurrentScope = currentScope,
            Permissions = permissions
        };

        _logger.LogInformation(
            "Auth/me response for user {UserId}: {RoleCount} roles, {TenantCount} tenants, {PermissionCount} permissions, scope: {ScopeType}",
            user.Id,
            platformRoles.Count,
            memberships.Count,
            permissions.Count,
            currentScope?.Type ?? "platform");

        return Task.FromResult(Result.Success(response));
    }

    /// <summary>
    /// Builds the permissions dictionary based on current context.
    /// 
    /// Uses ICurrentUser which already has permissions loaded from
    /// the authentication pipeline (including tenant permissions if X-Tenant-Id present).
    /// </summary>
    private Dictionary<string, bool> BuildPermissionsDictionary(bool hasTenantScope)
    {
        var permissions = new Dictionary<string, bool>();

        // Get all defined permission keys for comparison
        var allPlatformPermissions = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Platform)
            .Select(p => p.Key)
            .ToHashSet();

        var allTenantPermissions = Permissions.All()
            .Where(p => p.Scope == PermissionScope.Tenant)
            .Select(p => p.Key)
            .ToHashSet();

        // ─────────────────────────────────────────────────────────────────
        // Platform permissions (always included)
        // Mark as true if user has it, false otherwise
        // ─────────────────────────────────────────────────────────────────
        foreach (var permKey in allPlatformPermissions)
        {
            permissions[permKey] = _currentUser.PlatformPermissions.Contains(permKey);
        }

        // ─────────────────────────────────────────────────────────────────
        // Tenant permissions (only if tenant scope is active)
        // ─────────────────────────────────────────────────────────────────
        if (hasTenantScope)
        {
            foreach (var permKey in allTenantPermissions)
            {
                permissions[permKey] = _currentUser.TenantPermissions.Contains(permKey);
            }
        }

        return permissions;
    }
}
