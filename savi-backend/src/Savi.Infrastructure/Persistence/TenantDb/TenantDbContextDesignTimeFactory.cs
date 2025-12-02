using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Savi.Infrastructure.Persistence.TenantDb;

/// <summary>
/// Design-time factory for TenantDbContext.
/// Used by EF Core tools (migrations, scaffolding) at design time.
/// </summary>
public class TenantDbContextDesignTimeFactory : IDesignTimeDbContextFactory<TenantDbContext>
{
    public TenantDbContext CreateDbContext(string[] args)
    {
        // Use SQLite for design-time migrations (simplest option)
        // The actual tenant databases will use their configured provider (PostgreSQL/SQL Server/SQLite)
        var optionsBuilder = new DbContextOptionsBuilder<TenantDbContext>();
        optionsBuilder.UseSqlite("Data Source=design_time_tenant.db");

        return new TenantDbContext(optionsBuilder.Options);
    }
}
