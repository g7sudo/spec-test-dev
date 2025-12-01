using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Savi.Infrastructure.Persistence.Platform;

/// <summary>
/// Design-time factory for creating PlatformDbContext during EF Core migrations.
/// 
/// Usage:
///   cd src/Savi.Infrastructure
///   dotnet ef migrations add InitialCreate --context PlatformDbContext --output-dir Persistence/Migrations/Platform
/// </summary>
public class PlatformDbContextFactory : IDesignTimeDbContextFactory<PlatformDbContext>
{
    public PlatformDbContext CreateDbContext(string[] args)
    {
        // Default connection string for design-time (migrations)
        // This should be overridden in actual deployments via configuration
        var connectionString = "Host=localhost;Database=Savi_Platform_Dev;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<PlatformDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new PlatformDbContext(optionsBuilder.Options);
    }
}

