using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyPrivacySettings;

/// <summary>
/// Handler for updating the current user's privacy/directory settings.
/// </summary>
public class UpdateMyPrivacySettingsCommandHandler : IRequestHandler<UpdateMyPrivacySettingsCommand, Result<MediatR.Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyPrivacySettingsCommandHandler> _logger;

    public UpdateMyPrivacySettingsCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyPrivacySettingsCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<MediatR.Unit>> Handle(UpdateMyPrivacySettingsCommand request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("UpdateMyPrivacySettings called without tenant context");
            return Result<MediatR.Unit>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Updating privacy settings for community user {CommunityUserId}", tenantUserId);

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

        // Update privacy settings
        profile.UpdatePrivacySettings(
            directoryVisibility: request.DirectoryVisibility,
            showInDirectory: request.ShowInDirectory,
            showNameInDirectory: request.ShowNameInDirectory,
            showUnitInDirectory: request.ShowUnitInDirectory,
            showPhoneInDirectory: request.ShowPhoneInDirectory,
            showEmailInDirectory: request.ShowEmailInDirectory,
            showProfilePhotoInDirectory: request.ShowProfilePhotoInDirectory,
            updatedBy: tenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Privacy settings updated successfully for community user {CommunityUserId}", tenantUserId);

        return Result<MediatR.Unit>.Success(MediatR.Unit.Value);
    }
}

