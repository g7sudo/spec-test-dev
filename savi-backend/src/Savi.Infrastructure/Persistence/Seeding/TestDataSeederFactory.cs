using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Infrastructure.Persistence.TenantDb;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Factory for creating TestDataSeeder instances.
/// </summary>
public class TestDataSeederFactory : ITestDataSeederFactory
{
    private readonly ILoggerFactory _loggerFactory;

    public TestDataSeederFactory(ILoggerFactory loggerFactory)
    {
        _loggerFactory = loggerFactory;
    }

    /// <inheritdoc />
    public ITestDataSeeder Create(object tenantDbContext)
    {
        if (tenantDbContext is not TenantDbContext context)
        {
            throw new ArgumentException(
                "Expected TenantDbContext but received " + tenantDbContext.GetType().Name,
                nameof(tenantDbContext));
        }

        return new TestDataSeeder(
            context,
            _loggerFactory.CreateLogger<TestDataSeeder>());
    }
}
