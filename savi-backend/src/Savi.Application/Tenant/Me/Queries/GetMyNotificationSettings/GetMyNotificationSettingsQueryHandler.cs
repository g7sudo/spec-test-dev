using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Queries.GetMyNotificationSettings;

/// <summary>
/// Handler for getting the current user's notification settings.
/// Creates a default profile if one doesn't exist.
/// </summary>
public class GetMyNotificationSettingsQueryHandler : IRequestHandler<GetMyNotificationSettingsQuery, Result<NotificationSettingsDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<GetMyNotificationSettingsQueryHandler> _logger;

    public GetMyNotificationSettingsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<GetMyNotificationSettingsQueryHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<NotificationSettingsDto>> Handle(GetMyNotificationSettingsQuery request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("GetMyNotificationSettings called without tenant context");
            return Result<NotificationSettingsDto>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Getting notification settings for community user {CommunityUserId}", tenantUserId);

        // Get or create profile
        var profile = await _dbContext.CommunityUserProfiles
            .AsNoTracking()
            .Where(p => p.CommunityUserId == tenantUserId && p.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        // If no profile exists, create one with defaults
        if (profile == null)
        {
            _logger.LogInformation("Creating default profile for community user {CommunityUserId}", tenantUserId);

            profile = CommunityUserProfile.Create(
                communityUserId: tenantUserId.Value,
                displayName: null,
                createdBy: tenantUserId);

            _dbContext.Add(profile);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var dto = new NotificationSettingsDto
        {
            PushEnabled = profile.PushEnabled,
            EmailEnabled = profile.EmailEnabled,
            NotifyMaintenanceUpdates = profile.NotifyMaintenanceUpdates,
            NotifyAmenityBookings = profile.NotifyAmenityBookings,
            NotifyVisitorAtGate = profile.NotifyVisitorAtGate,
            NotifyAnnouncements = profile.NotifyAnnouncements,
            NotifyMarketplace = profile.NotifyMarketplace
        };

        return Result<NotificationSettingsDto>.Success(dto);
    }
}
