using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.UpdateMyNotificationSettings;

/// <summary>
/// Handler for updating the current user's notification preferences.
/// </summary>
public class UpdateMyNotificationSettingsCommandHandler : IRequestHandler<UpdateMyNotificationSettingsCommand, Result<MediatR.Unit>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateMyNotificationSettingsCommandHandler> _logger;

    public UpdateMyNotificationSettingsCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<UpdateMyNotificationSettingsCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<MediatR.Unit>> Handle(UpdateMyNotificationSettingsCommand request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("UpdateMyNotificationSettings called without tenant context");
            return Result<MediatR.Unit>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Updating notification settings for community user {CommunityUserId}", tenantUserId);

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

        // Update notification settings
        profile.UpdateNotificationSettings(
            pushEnabled: request.PushEnabled,
            emailEnabled: request.EmailEnabled,
            notifyMaintenanceUpdates: request.NotifyMaintenanceUpdates,
            notifyAmenityBookings: request.NotifyAmenityBookings,
            notifyVisitorAtGate: request.NotifyVisitorAtGate,
            notifyAnnouncements: request.NotifyAnnouncements,
            notifyMarketplace: request.NotifyMarketplace,
            updatedBy: tenantUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Notification settings updated successfully for community user {CommunityUserId}", tenantUserId);

        return Result<MediatR.Unit>.Success(MediatR.Unit.Value);
    }
}

