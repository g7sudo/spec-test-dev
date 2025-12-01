using System;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Savi.Application;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants;
using Savi.Infrastructure.Auditing;
using Savi.Infrastructure.Identity;
using Savi.Infrastructure.Persistence.Platform;
using Savi.Infrastructure.Persistence.TenantDb;
using Savi.MultiTenancy;
using Savi.MultiTenancy.Extensions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Api.Configuration;

/// <summary>
/// Extension methods for configuring services in the DI container.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds all SAVI application services to the DI container.
    /// </summary>
    public static IServiceCollection AddSaviServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Add HTTP context accessor (needed for ICurrentUser)
        services.AddHttpContextAccessor();

        // Add memory cache (for permission caching)
        services.AddMemoryCache();

        // Add multi-tenancy
        services.AddMultiTenancy();

        // Bind tenant invitation settings
        services.Configure<TenantInvitationOptions>(
            configuration.GetSection(TenantInvitationOptions.SectionName));

        // Add platform user bootstrap service (must be before ICurrentUser)
        services.AddScoped<IPlatformUserBootstrapService, PlatformUserBootstrapService>();

        // Add ICurrentUser implementation
        services.AddScoped<ICurrentUser, CurrentUser>();

        // Add Platform DbContext
        services.AddDbContext<PlatformDbContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("PlatformDb")
                ?? throw new InvalidOperationException("PlatformDb connection string not configured.");

            var provider = configuration["DatabaseProvider"]?.ToLowerInvariant() ?? "postgresql";

            // Use SQLite for development, PostgreSQL for production
            switch (provider)
            {
                case "sqlite":
                    options.UseSqlite(connectionString);
                    break;
                case "postgresql":
                case "postgres":
                case "npgsql":
                default:
                    options.UseNpgsql(connectionString);
                    break;
            }
        });

        // Register IPlatformDbContext interface
        services.AddScoped<IPlatformDbContext>(sp => sp.GetRequiredService<PlatformDbContext>());

        // Add TenantDbContext factory
        services.AddScoped<ITenantDbContextFactory, TenantDbContextFactory>();
        services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
        services.AddScoped<ITenantAdminOnboardingService, TenantAdminOnboardingService>();

        // Add MediatR
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining<ApplicationAssemblyMarker>();
        });

        // Add FluentValidation
        services.AddValidatorsFromAssemblyContaining<ApplicationAssemblyMarker>();

        // Add Audit.NET logging
        services.AddAuditLogging();

        return services;
    }

    /// <summary>
    /// Adds Firebase JWT authentication.
    /// </summary>
    public static IServiceCollection AddSaviAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var firebaseProjectId = configuration["Firebase:ProjectId"]
            ?? throw new InvalidOperationException("Firebase:ProjectId not configured.");

        var jwksUriOverride = configuration["Firebase:JwksUri"];
        var cacheMinutes = configuration.GetValue<int?>("Firebase:KeyCacheMinutes");

        // Cache Firebase signing keys for a short window to avoid repeated HTTP calls.
        var signingKeyProvider = new FirebaseSigningKeyProvider(
            jwksUriOverride,
            cacheMinutes.HasValue ? TimeSpan.FromMinutes(cacheMinutes.Value) : null);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
                    ValidateAudience = true,
                    ValidAudience = firebaseProjectId,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    // Firebase rotates keys, so resolve them via our cache on every validation.
                    IssuerSigningKeyResolver = (_, _, _, _) => signingKeyProvider.GetSigningKeys()
                };
            });

        return services;
    }

    /// <summary>
    /// Adds rate limiting middleware configured per tenant.
    /// </summary>
    public static IServiceCollection AddSaviRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            // Default rate limit for requests without tenant context
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                // Try to get tenant context for per-tenant limiting
                var tenantContext = context.RequestServices.GetService<ITenantContext>();

                // Use tenant ID for partitioning, or fall back to IP address
                var partitionKey = tenantContext?.TenantId?.ToString()
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous";

                // Default limit: 100 requests per minute
                // TODO: Load actual limits from Plan/PlanFeature when available
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}

