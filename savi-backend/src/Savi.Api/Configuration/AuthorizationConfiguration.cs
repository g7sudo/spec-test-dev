using Microsoft.AspNetCore.Authorization;
using Savi.SharedKernel.Authorization;
using Savi.SharedKernel.Interfaces;

namespace Savi.Api.Configuration;

/// <summary>
/// Extension methods for configuring authorization policies.
/// </summary>
public static class AuthorizationConfiguration
{
    /// <summary>
    /// Adds permission-based authorization policies.
    ///
    /// Creates one policy per permission key from the Permissions catalog.
    /// Also registers the AnyOfPolicyProvider for HasAnyPermission attribute support.
    /// </summary>
    public static IServiceCollection AddSaviAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // Register a policy for each permission
            foreach (var permissionDef in Permissions.All())
            {
                options.AddPolicy(permissionDef.Key, policy =>
                {
                    policy.RequireAuthenticatedUser();
                    policy.AddRequirements(new PermissionRequirement(permissionDef.Key));
                });
            }
        });

        // Register the permission requirement handler
        services.AddScoped<IAuthorizationHandler, PermissionRequirementHandler>();

        // Register the AnyPermission requirement handler for HasAnyPermission attribute
        services.AddScoped<IAuthorizationHandler, AnyPermissionRequirementHandler>();

        // Register the custom policy provider for "AnyOf:" policies
        services.AddSingleton<IAuthorizationPolicyProvider, AnyOfPolicyProvider>();

        return services;
    }
}

/// <summary>
/// Requirement for a specific permission.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The permission key required.
    /// </summary>
    public string PermissionKey { get; }

    public PermissionRequirement(string permissionKey)
    {
        PermissionKey = permissionKey;
    }
}

/// <summary>
/// Handler that checks if the current user has the required permission.
/// 
/// Checks both platform permissions and tenant permissions via ICurrentUser.
/// </summary>
public class PermissionRequirementHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<PermissionRequirementHandler> _logger;

    public PermissionRequirementHandler(
        ICurrentUser currentUser,
        ILogger<PermissionRequirementHandler> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Check if user is authenticated
        if (context.User.Identity?.IsAuthenticated != true)
        {
            _logger.LogDebug(
                "Permission check failed: User not authenticated. Required: {Permission}",
                requirement.PermissionKey);
            return Task.CompletedTask;
        }

        // Check if user has the required permission (platform or tenant level)
        if (_currentUser.HasPermission(requirement.PermissionKey))
        {
            context.Succeed(requirement);

            _logger.LogDebug(
                "Permission check passed for {Permission} (User: {UserId})",
                requirement.PermissionKey,
                _currentUser.UserId);
        }
        else
        {
            _logger.LogDebug(
                "Permission check failed for {Permission} (User: {UserId})",
                requirement.PermissionKey,
                _currentUser.UserId);
        }

        return Task.CompletedTask;
    }
}

