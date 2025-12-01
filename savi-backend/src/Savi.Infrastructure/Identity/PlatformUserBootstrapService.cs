using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Savi.Domain.Platform;
using Savi.Infrastructure.Persistence.Platform;

// Required for IConfiguration.GetSection().Get<T>() extension method

namespace Savi.Infrastructure.Identity;

/// <summary>
/// Service responsible for bootstrapping platform users on first login.
/// 
/// Handles:
/// - Creating PlatformUser if not exists
/// - Auto-assigning PLATFORM_ADMIN role to root admin emails
/// </summary>
public interface IPlatformUserBootstrapService
{
    /// <summary>
    /// Ensures a PlatformUser exists for the given Firebase credentials.
    /// If the email is in RootAdmins config, assigns PLATFORM_ADMIN role.
    /// </summary>
    Task<PlatformUser> EnsurePlatformUserAsync(
        string firebaseUid,
        string email,
        string? fullName = null,
        CancellationToken ct = default);
}

/// <summary>
/// Implementation of IPlatformUserBootstrapService.
/// </summary>
public class PlatformUserBootstrapService : IPlatformUserBootstrapService
{
    private readonly PlatformDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PlatformUserBootstrapService> _logger;

    // Cache the root admin emails for performance
    private readonly HashSet<string> _rootAdminEmails;

    public PlatformUserBootstrapService(
        PlatformDbContext dbContext,
        IConfiguration configuration,
        ILogger<PlatformUserBootstrapService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;

        // Load root admin emails from config (case-insensitive)
        _rootAdminEmails = configuration
            .GetSection("RootAdmins:Emails")
            .Get<string[]>()
            ?.Select(e => e.ToLowerInvariant())
            .ToHashSet() ?? new HashSet<string>();

        _logger.LogInformation(
            "PlatformUserBootstrapService initialized with {Count} root admin emails",
            _rootAdminEmails.Count);
    }

    /// <inheritdoc />
    public async Task<PlatformUser> EnsurePlatformUserAsync(
        string firebaseUid,
        string email,
        string? fullName = null,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.ToLowerInvariant();

        // Try to find existing user by FirebaseUid first
        var existingUser = await _dbContext.PlatformUsersSet
            .FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid, ct);

        if (existingUser != null)
        {
            _logger.LogDebug("Found existing PlatformUser by FirebaseUid: {UserId}", existingUser.Id);
            return existingUser;
        }

        // Try to find by email (user might exist from an invitation)
        existingUser = await _dbContext.PlatformUsersSet
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, ct);

        if (existingUser != null)
        {
            // Link the FirebaseUid to the existing user
            _logger.LogInformation(
                "Linking FirebaseUid to existing PlatformUser: {UserId} ({Email})",
                existingUser.Id, existingUser.Email);

            existingUser.LinkFirebaseAccount(firebaseUid);
            await _dbContext.SaveChangesAsync(ct);
            return existingUser;
        }

        // Create new PlatformUser
        _logger.LogInformation("Creating new PlatformUser for {Email}", email);

        var newUser = PlatformUser.Create(
            firebaseUid: firebaseUid,
            email: email,
            fullName: fullName);

        _dbContext.PlatformUsersSet.Add(newUser);
        await _dbContext.SaveChangesAsync(ct);

        // Check if this is a root admin email
        if (_rootAdminEmails.Contains(normalizedEmail))
        {
            await AssignPlatformAdminRoleAsync(newUser, ct);
        }

        return newUser;
    }

    /// <summary>
    /// Assigns the PLATFORM_ADMIN role to a user if not already assigned.
    /// </summary>
    private async Task AssignPlatformAdminRoleAsync(PlatformUser user, CancellationToken ct)
    {
        // Find the PLATFORM_ADMIN role
        var adminRole = await _dbContext.PlatformRolesSet
            .FirstOrDefaultAsync(r => r.Code == "PLATFORM_ADMIN" && r.IsActive, ct);

        if (adminRole == null)
        {
            _logger.LogWarning("PLATFORM_ADMIN role not found in database. Skipping role assignment.");
            return;
        }

        // Check if already assigned
        var existingAssignment = await _dbContext.PlatformUserRolesSet
            .AnyAsync(ur => ur.PlatformUserId == user.Id && ur.PlatformRoleId == adminRole.Id, ct);

        if (existingAssignment)
        {
            _logger.LogDebug("User {UserId} already has PLATFORM_ADMIN role", user.Id);
            return;
        }

        // Assign the role
        var userRole = PlatformUserRole.Create(
            platformUserId: user.Id,
            platformRoleId: adminRole.Id);

        _dbContext.PlatformUserRolesSet.Add(userRole);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Assigned PLATFORM_ADMIN role to user {UserId} ({Email}) - root admin bootstrap",
            user.Id, user.Email);
    }
}

