using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Savi.MultiTenancy.Middleware;

/// <summary>
/// Middleware that resolves tenant context from X-Tenant-Id header.
/// 
/// This middleware:
/// 1. Reads X-Tenant-Id header (string)
/// 2. Parses to Guid (if present)
/// 3. Sets ITenantContext in scoped DI
/// 4. Enriches logs with TenantId (when logging enricher is configured)
/// 
/// Note: DB lookup for tenant validation will be added when PlatformDbContext is ready.
/// For now, it just parses the header.
/// </summary>
public class TenantContextMiddleware
{
    /// <summary>
    /// Header name for tenant ID.
    /// </summary>
    public const string TenantIdHeader = "X-Tenant-Id";

    private readonly RequestDelegate _next;
    private readonly ILogger<TenantContextMiddleware> _logger;

    public TenantContextMiddleware(
        RequestDelegate next,
        ILogger<TenantContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
        // Try to read X-Tenant-Id header
        if (context.Request.Headers.TryGetValue(TenantIdHeader, out var tenantIdHeader))
        {
            var tenantIdString = tenantIdHeader.FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(tenantIdString))
            {
                if (Guid.TryParse(tenantIdString, out var tenantId))
                {
                    // For now, just set the tenant ID.
                    // TODO: Lookup tenant from PlatformDB to get Code, Name, ConnectionString.
                    // TODO: Validate that the current user has membership in this tenant.
                    tenantContext.SetTenant(
                        tenantId: tenantId,
                        tenantCode: null,
                        tenantName: null,
                        provider: null,
                        connectionString: null);

                    _logger.LogDebug(
                        "Tenant context set for TenantId: {TenantId}",
                        tenantId);
                }
                else
                {
                    _logger.LogWarning(
                        "Invalid X-Tenant-Id header value: {TenantIdHeader}",
                        tenantIdString);
                }
            }
        }

        await _next(context);
    }
}

