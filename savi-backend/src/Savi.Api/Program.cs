using Savi.Api.Configuration;
using Savi.Api.Middleware;
using Savi.Infrastructure.Auditing;
using Savi.Infrastructure.Persistence.Seeding;
using Savi.MultiTenancy.Extensions;
using Serilog;

// ============================================================
// SAVI Backend API
// ============================================================

var builder = WebApplication.CreateBuilder(args);

// ------------------------------------------------
// Configure Serilog
// ------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Starting SAVI API...");

    // ------------------------------------------------
    // Add services to the container
    // ------------------------------------------------

    // Controllers with API versioning
    builder.Services.AddControllers();

    // API Versioning
    builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

    // CORS - Allow frontend origins
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",   // Next.js dev server
                    "http://localhost:5173",   // Vite dev server
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:5173")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });

    // OpenAPI/Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "SAVI API",
            Version = "v1",
            Description = "Multi-tenant SaaS  management"
        });

        // Add JWT Bearer auth to Swagger
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter your Firebase ID token"
        });

        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // SAVI services (DbContexts, MediatR, FluentValidation, etc.)
    builder.Services.AddSaviServices(builder.Configuration);

    // Authentication (Firebase JWT)
    builder.Services.AddSaviAuthentication(builder.Configuration);

    // Authorization (permission-based policies)
    builder.Services.AddSaviAuthorization();

    // Rate limiting (per-tenant)
    builder.Services.AddSaviRateLimiting();

    // Database seeding
    builder.Services.AddDatabaseSeeding();

    // ------------------------------------------------
    // Build the app
    // ------------------------------------------------
    var app = builder.Build();

    // Apply migrations and seed database on startup (in development)
    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<Savi.Infrastructure.Persistence.Platform.PlatformDbContext>();
        
        // Ensure database is created (for SQLite) or apply pending migrations
        await dbContext.Database.EnsureCreatedAsync();
        
        await app.Services.SeedDatabaseAsync();
    }

    // ------------------------------------------------
    // Configure the HTTP request pipeline
    // ------------------------------------------------

    // Global exception handling (first in pipeline)
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Security headers
    app.Use(async (context, next) =>
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        await next();
    });

    // HTTPS redirection (skip in development)
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }

    // CORS - must be before auth middleware
    app.UseCors("AllowFrontend");

    // Swagger (development only by default, or controlled by config)
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Rate limiting
    app.UseRateLimiter();

    // Authentication & Authorization
    app.UseAuthentication();

    // Tenant context middleware (after auth, before authorization)
    app.UseTenantContext();

    // Audit context enrichment (after auth and tenant context)
    app.UseAuditContext();

    app.UseAuthorization();

    // Map controllers
    app.MapControllers();

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck")
        .WithTags("Health");

    Log.Information("SAVI API started successfully");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SAVI API failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
