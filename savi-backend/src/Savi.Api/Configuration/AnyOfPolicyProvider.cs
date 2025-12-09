using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Interfaces;

namespace Savi.Api.Configuration;

/// <summary>
/// Dynamic policy provider that handles "AnyOf:" policies for HasAnyPermission attribute.
/// </summary>
public class AnyOfPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;

    public AnyOfPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(HasAnyPermissionAttribute.PolicyPrefix))
        {
            var permissionKeys = policyName
                .Substring(HasAnyPermissionAttribute.PolicyPrefix.Length)
                .Split(',', StringSplitOptions.RemoveEmptyEntries);

            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new AnyPermissionRequirement(permissionKeys))
                .Build();

            return Task.FromResult<AuthorizationPolicy?>(policy);
        }

        return _fallbackPolicyProvider.GetPolicyAsync(policyName);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
    {
        return _fallbackPolicyProvider.GetDefaultPolicyAsync();
    }

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
    {
        return _fallbackPolicyProvider.GetFallbackPolicyAsync();
    }
}

/// <summary>
/// Requirement that is satisfied if the user has any one of the specified permissions.
/// Also considers permission hierarchy (e.g., MANAGE implies MANAGE_OWN).
/// </summary>
public class AnyPermissionRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The permission keys, any one of which satisfies this requirement.
    /// </summary>
    public string[] PermissionKeys { get; }

    public AnyPermissionRequirement(string[] permissionKeys)
    {
        PermissionKeys = permissionKeys;
    }
}

/// <summary>
/// Handler that checks if the current user has any of the required permissions.
/// Uses PermissionHierarchy to check implied permissions.
/// </summary>
public class AnyPermissionRequirementHandler : AuthorizationHandler<AnyPermissionRequirement>
{
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AnyPermissionRequirementHandler> _logger;

    public AnyPermissionRequirementHandler(
        ICurrentUser currentUser,
        ILogger<AnyPermissionRequirementHandler> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AnyPermissionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            _logger.LogDebug(
                "AnyPermission check failed: User not authenticated. Required any of: {Permissions}",
                string.Join(", ", requirement.PermissionKeys));
            return Task.CompletedTask;
        }

        // Combine platform and tenant permissions for hierarchy check
        var allPermissions = _currentUser.PlatformPermissions
            .Concat(_currentUser.TenantPermissions)
            .ToHashSet();

        // Check each required permission, including hierarchy
        foreach (var permissionKey in requirement.PermissionKeys)
        {
            // Direct permission check
            if (_currentUser.HasPermission(permissionKey))
            {
                context.Succeed(requirement);
                _logger.LogDebug(
                    "AnyPermission check passed with direct permission {Permission} (User: {UserId})",
                    permissionKey,
                    _currentUser.UserId);
                return Task.CompletedTask;
            }

            // Check if any broader permission implies this one
            if (PermissionHierarchy.HasPermissionOrImplied(allPermissions, permissionKey))
            {
                context.Succeed(requirement);
                _logger.LogDebug(
                    "AnyPermission check passed with implied permission for {Permission} (User: {UserId})",
                    permissionKey,
                    _currentUser.UserId);
                return Task.CompletedTask;
            }
        }

        _logger.LogDebug(
            "AnyPermission check failed. Required any of: {Permissions} (User: {UserId})",
            string.Join(", ", requirement.PermissionKeys),
            _currentUser.UserId);

        return Task.CompletedTask;
    }
}
