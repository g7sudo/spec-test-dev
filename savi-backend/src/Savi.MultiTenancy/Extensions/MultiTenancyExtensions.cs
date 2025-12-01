using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Savi.MultiTenancy.Middleware;

namespace Savi.MultiTenancy.Extensions;

/// <summary>
/// Extension methods for registering multi-tenancy services and middleware.
/// </summary>
public static class MultiTenancyExtensions
{
    /// <summary>
    /// Adds multi-tenancy services to the service collection.
    /// </summary>
    public static IServiceCollection AddMultiTenancy(this IServiceCollection services)
    {
        // Register TenantContext as scoped (one per request)
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());

        return services;
    }

    /// <summary>
    /// Adds tenant context middleware to the pipeline.
    /// 
    /// This should be called after UseAuthentication() but before UseAuthorization()
    /// so that tenant context is available for authorization checks.
    /// </summary>
    public static IApplicationBuilder UseTenantContext(this IApplicationBuilder app)
    {
        return app.UseMiddleware<TenantContextMiddleware>();
    }
}

