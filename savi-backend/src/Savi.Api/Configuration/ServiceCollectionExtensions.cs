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
using Savi.Application.Tenant.ResidentInvites;
using Savi.Application.Common.Authorization;
using Savi.Infrastructure.Auditing;
using Savi.Infrastructure.Authorization;
using Savi.Infrastructure.Email;
using Savi.Infrastructure.Identity;
using Savi.Infrastructure.Notifications;
using Savi.Infrastructure.Persistence.Platform;
using Savi.Infrastructure.Persistence.Seeding;
using Savi.Infrastructure.Persistence.TenantDb;
using Savi.Infrastructure.Storage;
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

        // Bind resident invitation settings
        services.Configure<ResidentInvitationOptions>(
            configuration.GetSection(ResidentInvitationOptions.SectionName));

        // Add platform user bootstrap service (must be before ICurrentUser)
        services.AddScoped<IPlatformUserBootstrapService, PlatformUserBootstrapService>();

        // Add ICurrentUser implementation
        services.AddScoped<ICurrentUser, CurrentUser>();

        // Add Resource Ownership Checker for permission-based access control
        services.AddScoped<IResourceOwnershipChecker, ResourceOwnershipChecker>();

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
        services.AddScoped<TenantDbContextFactory>();
        services.AddScoped<ITenantDbContextFactory, TenantDbContextFactory>();
        services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
        services.AddScoped<ITenantAdminOnboardingService, TenantAdminOnboardingService>();

        // Add Tenant Database Migrator
        services.AddScoped<ITenantDatabaseMigrator, Savi.Infrastructure.Services.TenantDatabaseMigrator>();

        // Add Test Data Seeder Factory
        services.AddScoped<ITestDataSeederFactory, TestDataSeederFactory>();

        // Register ITenantDbContext per request using factory
        // This creates TenantDbContext based on current tenant context
        // Note: We use GetAwaiter().GetResult() instead of Wait() to avoid deadlock issues
        // This is acceptable here because we're in a synchronous factory delegate context
        services.AddScoped<ITenantDbContext>(sp =>
        {
            var tenantContext = sp.GetRequiredService<ITenantContext>();
            var factory = sp.GetRequiredService<ITenantDbContextFactory>();

            if (!tenantContext.HasTenant || !tenantContext.TenantId.HasValue)
            {
                throw new InvalidOperationException(
                    "Cannot create TenantDbContext: No tenant context available. Ensure X-Tenant-Id header is set.");
            }

            // Create TenantDbContext synchronously using GetAwaiter().GetResult()
            // This avoids deadlock issues that can occur with Task.Wait()
            // GetAwaiter().GetResult() properly unwraps exceptions and avoids deadlocks
            var dbContext = factory.CreateAsync(tenantContext.TenantId.Value)
                .GetAwaiter()
                .GetResult();
            
            if (dbContext is TenantDbContext tenantDbContext)
            {
                return tenantDbContext;
            }

            throw new InvalidOperationException(
                $"TenantDbContextFactory returned unexpected type: {dbContext?.GetType().Name}");
        });

        // Add File Storage Service
        services.AddScoped<IFileStorageService, AzureBlobStorageService>();

        // Add Email Service
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.AddHttpClient<IEmailService, MailerooEmailService>();

        // Add MediatR
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining<ApplicationAssemblyMarker>();
        });

        // Add FluentValidation
        services.AddValidatorsFromAssemblyContaining<ApplicationAssemblyMarker>();

        // Add Audit.NET logging
        services.AddAuditLogging();

        // Add Push Notification Services
        services.AddPushNotifications(configuration);

        return services;
    }

    /// <summary>
    /// Adds push notification services (Firebase) and queue processor.
    /// </summary>
    public static IServiceCollection AddPushNotifications(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure Firebase options
        services.Configure<FirebasePushNotificationOptions>(
            configuration.GetSection(FirebasePushNotificationOptions.SectionName));

        // Configure queue processor options
        services.Configure<NotificationQueueProcessorOptions>(
            configuration.GetSection(NotificationQueueProcessorOptions.SectionName));

        // Register push notification service
        services.AddSingleton<IPushNotificationService, FirebasePushNotificationService>();

        // Register queue processor as hosted service
        services.AddHostedService<NotificationQueueProcessor>();

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

