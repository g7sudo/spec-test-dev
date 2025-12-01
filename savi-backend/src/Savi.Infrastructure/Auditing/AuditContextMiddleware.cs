using Audit.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Savi.MultiTenancy;
using Savi.SharedKernel.Interfaces;

namespace Savi.Infrastructure.Auditing;

/// <summary>
/// Middleware that enriches Audit.NET events with user and tenant context.
/// Must be placed after authentication and tenant context middleware.
/// </summary>
public class AuditContextMiddleware
{
    private readonly RequestDelegate _next;

    public AuditContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Set up audit scope with context info
        using (var scope = AuditScope.Create(new AuditScopeOptions
        {
            EventType = $"HTTP:{context.Request.Method}:{context.Request.Path}",
            CreationPolicy = EventCreationPolicy.Manual
        }))
        {
            // Try to get current user
            var currentUser = context.RequestServices.GetService(typeof(ICurrentUser)) as ICurrentUser;
            var tenantContext = context.RequestServices.GetService(typeof(ITenantContext)) as ITenantContext;

            // Enrich with user info
            if (currentUser != null)
            {
                try
                {
                    scope.SetCustomField("UserId", currentUser.UserId);
                    scope.SetCustomField("Email", currentUser.Email);
                }
                catch
                {
                    // User may not be authenticated
                }
            }

            // Enrich with tenant info
            if (tenantContext?.HasTenant == true)
            {
                scope.SetCustomField("TenantId", tenantContext.TenantId);
                scope.SetCustomField("TenantCode", tenantContext.TenantCode);
            }

            // Add correlation ID
            var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                ?? context.TraceIdentifier;
            scope.SetCustomField("CorrelationId", correlationId);

            await _next(context);
        }
    }
}

/// <summary>
/// Extension methods for audit middleware.
/// </summary>
public static class AuditMiddlewareExtensions
{
    /// <summary>
    /// Adds audit context enrichment middleware.
    /// Should be called after UseAuthentication and UseTenantContext.
    /// </summary>
    public static IApplicationBuilder UseAuditContext(this IApplicationBuilder app)
    {
        return app.UseMiddleware<AuditContextMiddleware>();
    }
}

