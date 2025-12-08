using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyAppSettings;

/// <summary>
/// Handler for updating the current user's app settings.
/// </summary>
public class UpdateMyAppSettingsCommandHandler : IRequestHandler<UpdateMyAppSettingsCommand, Result<MediatR.Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyAppSettingsCommandHandler> _logger;

    public UpdateMyAppSettingsCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyAppSettingsCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<MediatR.Unit>> Handle(UpdateMyAppSettingsCommand request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("UpdateMyAppSettings called without tenant context");
            return Result<MediatR.Unit>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Updating app settings for community user {CommunityUserId}", tenantUserId);

        // Get or create profile
        var profile = await _dbContext.CommunityUserProfiles
            .FirstOrDefaultAsync(p => p.CommunityUserId == tenantUserId && p.IsActive, cancellationToken);

        if (profile == null)
        {
            // Create profile if it doesn't exist
            profile = CommunityUserProfile.Create(
                communityUserId: tenantUserId.Value,
                displayName: null,
                createdBy: tenantUserId);

            _dbContext.Add(profile);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        // Update app settings
        profile.UpdateAppSettings(
            theme: request.Theme,
            biometricEnabled: request.BiometricEnabled,
            locale: request.Locale,
            updatedBy: tenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("App settings updated successfully for community user {CommunityUserId}", tenantUserId);

        return Result<MediatR.Unit>.Success(MediatR.Unit.Value);
    }
}
