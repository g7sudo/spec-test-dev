using Microsoft.AspNetCore.Authorization;

namespace Savi.Api.Configuration;

/// <summary>
/// Attribute to require a specific permission for an endpoint.
/// 
/// Usage:
///   [HasPermission(Permissions.Tenant.Maintenance.RequestView)]
///   public Task<IActionResult> GetMaintenanceRequests() { ... }
/// 
/// NEVER use raw strings in [Authorize(Policy = "...")].
/// Always use this attribute with Permissions.* constants.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    /// <summary>
    /// Creates a new HasPermission attribute with the specified permission key.
    /// </summary>
    /// <param name="permissionKey">The permission key from Permissions static class.</param>
    public HasPermissionAttribute(string permissionKey)
        : base(permissionKey)
    {
    }
}

