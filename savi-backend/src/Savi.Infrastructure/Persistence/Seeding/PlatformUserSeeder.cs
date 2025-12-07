using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;

namespace Savi.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds a default platform admin user for development purposes.
/// </summary>
public class PlatformUserSeeder
{
    private readonly PlatformDbContext _dbContext;
    private readonly ILogger<PlatformUserSeeder> _logger;

    /// <summary>
    /// Default admin email for development.
    /// </summary>
    public const string DefaultAdminEmail = "admindemo@savi.app";

    /// <summary>
    /// Default admin full name for development.
    /// </summary>
    public const string DefaultAdminName = "Savi Admin";

    /// <summary>
    /// Gets the default admin user ID after seeding.
    /// </summary>
    public static Guid? DefaultAdminUserId { get; private set; }

    public PlatformUserSeeder(
        PlatformDbContext dbContext,
        ILogger<PlatformUserSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting platform user seeding...");

        // Check if default admin already exists
        var existingUser = await _dbContext.PlatformUsersSet
            .FirstOrDefaultAsync(u => u.Email == DefaultAdminEmail, cancellationToken);

        if (existingUser != null)
        {
            _logger.LogInformation("Default admin user '{Email}' already exists with ID {UserId}. Skipping seed.",
                DefaultAdminEmail, existingUser.Id);
            DefaultAdminUserId = existingUser.Id;
            return;
        }

        // Create the default admin user
        var adminUser = PlatformUser.Create(
            email: DefaultAdminEmail,
            fullName: DefaultAdminName,
            phoneNumber: "+973 1234 5678",
            firebaseUid: null);

        _dbContext.PlatformUsersSet.Add(adminUser);
        await _dbContext.SaveChangesAsync(cancellationToken);

        DefaultAdminUserId = adminUser.Id;

        _logger.LogInformation("Created default admin user '{Email}' with ID {UserId}",
            DefaultAdminEmail, adminUser.Id);
    }
}
