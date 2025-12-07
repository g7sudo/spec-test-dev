using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.MultiTenancy;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Commands.SeedTestData;

/// <summary>
/// Handler for seeding test/demo data for a specific tenant.
/// </summary>
public sealed class SeedTestDataCommandHandler
    : IRequestHandler<SeedTestDataCommand, Result<SeedTestDataResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ITenantDbContextFactory _tenantDbContextFactory;
    private readonly ITestDataSeederFactory _testDataSeederFactory;
    private readonly ILogger<SeedTestDataCommandHandler> _logger;

    public SeedTestDataCommandHandler(
        IPlatformDbContext platformDbContext,
        ITenantDbContextFactory tenantDbContextFactory,
        ITestDataSeederFactory testDataSeederFactory,
        ILogger<SeedTestDataCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _tenantDbContextFactory = tenantDbContextFactory;
        _testDataSeederFactory = testDataSeederFactory;
        _logger = logger;
    }

    public async Task<Result<SeedTestDataResponse>> Handle(
        SeedTestDataCommand command,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Seeding test data for tenant {TenantId}", command.TenantId);

        // Verify tenant exists and is active
        var tenant = await _platformDbContext.Tenants
            .AsNoTracking()
            .Where(t => t.Id == command.TenantId && t.IsActive)
            .Select(t => new { t.Id, t.Code, t.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<SeedTestDataResponse>($"Tenant {command.TenantId} not found or is inactive.");
        }

        try
        {
            // Create tenant DbContext
            var context = await _tenantDbContextFactory.CreateAsync(command.TenantId, cancellationToken);
            if (context == null)
            {
                return Result.Failure<SeedTestDataResponse>("Failed to create tenant DbContext.");
            }

            await using var tenantDbContext = context as IAsyncDisposable;

            // Create seeder and seed data
            var seeder = _testDataSeederFactory.Create(context);
            var stats = await seeder.SeedWithStatsAsync(cancellationToken);

            _logger.LogInformation(
                "Successfully seeded test data for tenant {TenantCode} ({TenantId})",
                tenant.Code,
                tenant.Id);

            return Result.Success(new SeedTestDataResponse
            {
                TenantId = tenant.Id,
                TenantCode = tenant.Code ?? string.Empty,
                Message = "Test data seeded successfully.",
                Stats = stats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed test data for tenant {TenantId}", command.TenantId);
            return Result.Failure<SeedTestDataResponse>($"Failed to seed test data: {ex.Message}");
        }
    }
}
