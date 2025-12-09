using Microsoft.AspNetCore.Authorization;

namespace Savi.Api.Configuration;

/// <summary>
/// Attribute to require any one of the specified permissions for an endpoint.
/// Uses OR logic - user needs at least one of the permissions.
///
/// Usage:
///   [HasAnyPermission(
///       Permissions.Tenant.Amenities.View,
///       Permissions.Tenant.Amenities.BookingViewOwn)]
///   public Task<IActionResult> GetBookings() { ... }
///
/// NEVER use raw strings in [Authorize(Policy = "...")].
/// Always use this attribute with Permissions.* constants.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public sealed class HasAnyPermissionAttribute : AuthorizeAttribute
{
    /// <summary>
    /// Prefix used to identify AnyOf policies.
    /// </summary>
    public const string PolicyPrefix = "AnyOf:";

    /// <summary>
    /// The permission keys that can satisfy this requirement (OR logic).
    /// </summary>
    public string[] PermissionKeys { get; }

    /// <summary>
    /// Creates a new HasAnyPermission attribute with the specified permission keys.
    /// User needs ANY ONE of these permissions to access the endpoint.
    /// </summary>
    /// <param name="permissionKeys">The permission keys from Permissions static class.</param>
    public HasAnyPermissionAttribute(params string[] permissionKeys)
        : base(PolicyPrefix + string.Join(",", permissionKeys))
    {
        PermissionKeys = permissionKeys;
    }
}
