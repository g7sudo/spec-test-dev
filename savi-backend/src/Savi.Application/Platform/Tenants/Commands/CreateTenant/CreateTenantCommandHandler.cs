using System;
using System.IO;
using System.Linq;
using MediatR;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.Domain.Platform;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Platform.Tenants.Commands.CreateTenant;

/// <summary>
/// Handler for CreateTenantCommand.
/// Creates a new tenant in PlatformDB.
/// </summary>
public sealed class CreateTenantCommandHandler
    : IRequestHandler<CreateTenantCommand, Result<CreateTenantResponse>>
{
    private const string DefaultProvider = "sqlite";

    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ITenantProvisioningService _tenantProvisioningService;
    private readonly ILogger<CreateTenantCommandHandler> _logger;

    public CreateTenantCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ITenantProvisioningService tenantProvisioningService,
        ILogger<CreateTenantCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _tenantProvisioningService = tenantProvisioningService;
        _logger = logger;
    }

    public async Task<Result<CreateTenantResponse>> Handle(
        CreateTenantCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;

        _logger.LogInformation(
            "Creating tenant: {TenantName} by user {UserId}",
            request.Name,
            _currentUser.UserId);

        // Validate name is provided
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<CreateTenantResponse>("Tenant name is required.");
        }

        // Generate code if not provided
        var code = request.Code ?? GenerateCode(request.Name);

        // Check if code already exists
        var codeExists = _platformDbContext.Tenants
            .Any(t => t.Code == code);

        if (codeExists)
        {
            return Result.Failure<CreateTenantResponse>($"Tenant code '{code}' already exists.");
        }

        // Resolve target plan (required for throttling + feature flags)
        var plan = ResolvePlan(request);
        if (plan == null)
        {
            return Result.Failure<CreateTenantResponse>(
                "No plan found. Ensure at least one plan exists or specify PlanId/PlanCode.");
        }

        var provider = DetermineProvider(request.DatabaseProvider);
        var connectionString = DetermineConnectionString(provider, request.ConnectionString, code);

        // Create the tenant entity using factory method
        var tenant = Domain.Platform.Tenant.Create(
            name: request.Name,
            provider: provider,
            connectionString: connectionString,
            code: code,
            createdBy: _currentUser.UserId);

        // Update address and contact info
        tenant.UpdateAddress(
            addressLine1: request.AddressLine1,
            addressLine2: request.AddressLine2,
            city: request.City,
            state: request.State,
            country: request.Country,
            postalCode: request.PostalCode,
            updatedBy: _currentUser.UserId);

        tenant.UpdatePrimaryContact(
            name: request.PrimaryContactName,
            email: request.PrimaryContactEmail,
            phone: request.PrimaryContactPhone,
            updatedBy: _currentUser.UserId);

        // Set timezone
        tenant.UpdateInfo(
            name: request.Name,
            code: code,
            timezone: request.Timezone ?? "UTC",
            updatedBy: _currentUser.UserId);

        // Assign the requested/computed plan
        var tenantPlan = TenantPlan.Create(
            tenantId: tenant.Id,
            planId: plan.Id,
            startsAt: DateTime.UtcNow,
            createdBy: _currentUser.UserId);

        // Add to context and save
        _platformDbContext.Add(tenant);
        _platformDbContext.Add(tenantPlan);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created tenant {TenantId} ({TenantCode}) - {TenantName} on plan {PlanCode}",
            tenant.Id,
            tenant.Code,
            tenant.Name,
            plan.Code);

        if (request.ProvisionTenantDatabase)
        {
            var provisionOptions = new TenantProvisioningOptions(
                TenantId: tenant.Id,
                TenantCode: code,
                Provider: provider,
                ConnectionString: connectionString,
                SeedDefaultRbac: request.SeedTenantRbac);

            await _tenantProvisioningService.ProvisionTenantAsync(provisionOptions, cancellationToken);
        }

        return Result.Success(new CreateTenantResponse
        {
            TenantId = tenant.Id,
            Code = code,
            Name = request.Name,
            PlanCode = plan.Code,
            Provider = provider
        });
    }

    /// <summary>
    /// Generates a URL-friendly code from the tenant name.
    /// </summary>
    private static string GenerateCode(string name)
    {
        // Convert to lowercase, replace spaces with hyphens, remove special chars
        var code = name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");

        // Keep only alphanumeric and hyphens
        code = new string(code.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());

        // Limit length
        if (code.Length > 32)
            code = code[..32];

        return code;
    }

    private Plan? ResolvePlan(CreateTenantRequest request)
    {
        Plan? plan = null;

        if (request.PlanId.HasValue)
        {
            plan = _platformDbContext.Plans
                .FirstOrDefault(p => p.Id == request.PlanId.Value && p.IsActive);
        }

        if (plan == null && !string.IsNullOrWhiteSpace(request.PlanCode))
        {
            var planCode = request.PlanCode.Trim().ToUpperInvariant();
            plan = _platformDbContext.Plans
                .FirstOrDefault(p => p.Code == planCode && p.IsActive);
        }

        if (plan == null)
        {
            plan = _platformDbContext.Plans
                .Where(p => p.IsActive)
                .OrderBy(p => p.CreatedAt)
                .FirstOrDefault();
        }

        return plan;
    }

    private static string DetermineProvider(string? requestedProvider)
    {
        if (string.IsNullOrWhiteSpace(requestedProvider))
        {
            return DefaultProvider;
        }

        return requestedProvider.Trim().ToLowerInvariant();
    }

    private static string DetermineConnectionString(
        string provider,
        string? requestedConnectionString,
        string tenantCode)
    {
        string connectionString;

        if (!string.IsNullOrWhiteSpace(requestedConnectionString))
        {
            connectionString = requestedConnectionString.Trim();
        }
        else
        {
            connectionString = provider switch
            {
                "sqlite" => $"Data Source=tenants/{tenantCode}.db",
                "sqlserver" or "mssql" => $"Server=localhost;Database=Savi_Tenant_{tenantCode};Trusted_Connection=True;MultipleActiveResultSets=true;",
                _ => $"Host=localhost;Database=Savi_Tenant_{tenantCode};"
            };
        }

        return provider == "sqlite"
            ? NormalizeSqliteConnectionString(connectionString)
            : connectionString;
    }

    private static string NormalizeSqliteConnectionString(string connectionString)
    {
        const string token = "data source=";
        var index = connectionString.IndexOf(token, StringComparison.OrdinalIgnoreCase);
        if (index < 0)
        {
            return connectionString;
        }

        var valueStart = index + token.Length;
        var valueEnd = connectionString.IndexOf(';', valueStart);
        var rawPath = (valueEnd >= 0
                ? connectionString.Substring(valueStart, valueEnd - valueStart)
                : connectionString[valueStart..])
            .Trim();

        if (string.IsNullOrWhiteSpace(rawPath))
        {
            return connectionString;
        }

        var baseDir = AppContext.BaseDirectory ?? Directory.GetCurrentDirectory();
        var absolutePath = Path.IsPathRooted(rawPath)
            ? rawPath
            : Path.GetFullPath(Path.Combine(baseDir, rawPath));

        var directory = Path.GetDirectoryName(absolutePath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var normalized = connectionString.Remove(valueStart, rawPath.Length)
            .Insert(valueStart, absolutePath);

        return normalized;
    }
}

