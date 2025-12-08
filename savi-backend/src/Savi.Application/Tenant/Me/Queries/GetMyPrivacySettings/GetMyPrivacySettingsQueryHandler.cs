using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Queries.GetMyPrivacySettings;

/// <summary>
/// Handler for getting the current user's privacy settings.
/// Creates a default profile if one doesn't exist.
/// </summary>
public class GetMyPrivacySettingsQueryHandler : IRequestHandler<GetMyPrivacySettingsQuery, Result<PrivacySettingsDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<GetMyPrivacySettingsQueryHandler> _logger;

    public GetMyPrivacySettingsQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<GetMyPrivacySettingsQueryHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<PrivacySettingsDto>> Handle(GetMyPrivacySettingsQuery request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("GetMyPrivacySettings called without tenant context");
            return Result<PrivacySettingsDto>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Getting privacy settings for community user {CommunityUserId}", tenantUserId);

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

        var dto = new PrivacySettingsDto
        {
            DirectoryVisibility = profile.DirectoryVisibility,
            ShowInDirectory = profile.ShowInDirectory,
            ShowNameInDirectory = profile.ShowNameInDirectory,
            ShowUnitInDirectory = profile.ShowUnitInDirectory,
            ShowPhoneInDirectory = profile.ShowPhoneInDirectory,
            ShowEmailInDirectory = profile.ShowEmailInDirectory,
            ShowProfilePhotoInDirectory = profile.ShowProfilePhotoInDirectory
        };

        return Result<PrivacySettingsDto>.Success(dto);
    }
}
