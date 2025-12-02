using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Me.Dtos;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Queries.GetMyProfile;

/// <summary>
/// Handler for getting the current user's community profile.
/// Creates a default profile if one doesn't exist.
/// </summary>
public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, Result<MyCommunityProfileDto>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<GetMyProfileQueryHandler> _logger;
    private readonly IFileStorageService _fileStorageService;

    public GetMyProfileQueryHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser,
        ILogger<GetMyProfileQueryHandler> logger,
        IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<MyCommunityProfileDto>> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var tenantUserId = _currentUser.TenantUserId;

        if (tenantUserId == null)
        {
            _logger.LogWarning("GetMyProfile called without tenant context");
            return Result<MyCommunityProfileDto>.Failure("Tenant context not available.");
        }

        _logger.LogInformation("Getting profile for community user {CommunityUserId}", tenantUserId);

        // Get the community user with party info
        var communityUser = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(u => u.Id == tenantUserId && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (communityUser == null)
        {
            _logger.LogWarning("Community user {CommunityUserId} not found", tenantUserId);
            return Result<MyCommunityProfileDto>.Failure("Community user not found.");
        }

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

        // Get party information
        var party = await _dbContext.Parties
            .AsNoTracking()
            .Where(p => p.Id == communityUser.PartyId && p.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        // Get primary contacts from party
        string? primaryEmail = null;
        string? primaryPhone = null;

        if (party != null)
        {
            primaryEmail = await _dbContext.PartyContacts
                .AsNoTracking()
                .Where(c => c.PartyId == party.Id &&
                            c.ContactType == PartyContactType.Email &&
                            c.IsActive)
                .OrderByDescending(c => c.IsPrimary)
                .Select(c => c.Value)
                .FirstOrDefaultAsync(cancellationToken);

            primaryPhone = await _dbContext.PartyContacts
                .AsNoTracking()
                .Where(c => c.PartyId == party.Id &&
                            (c.ContactType == PartyContactType.Mobile || c.ContactType == PartyContactType.Phone) &&
                            c.IsActive)
                .OrderByDescending(c => c.IsPrimary)
                .ThenBy(c => c.ContactType == PartyContactType.Mobile ? 0 : 1)
                .Select(c => c.Value)
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Resolve profile photo URL from document if available
        string? profilePhotoUrl = null;
        if (profile.ProfilePhotoDocumentId.HasValue)
        {
            var document = await _dbContext.Documents
                .AsNoTracking()
                .Where(d => d.Id == profile.ProfilePhotoDocumentId.Value && d.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (document != null)
            {
                try
                {
                    profilePhotoUrl = await _fileStorageService.GetDownloadUrlAsync(document.BlobPath, expiresInMinutes: 60, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to resolve profile photo URL for document {DocumentId}", document.Id);
                }
            }
        }

        var dto = new MyCommunityProfileDto
        {
            Id = profile.Id,
            CommunityUserId = profile.CommunityUserId,

            // Display settings
            DisplayName = profile.DisplayName,
            AboutMe = profile.AboutMe,
            ProfilePhotoDocumentId = profile.ProfilePhotoDocumentId,
            ProfilePhotoUrl = profilePhotoUrl,

            // Party information
            PartyName = party?.PartyName,
            FirstName = party?.FirstName,
            LastName = party?.LastName,
            PrimaryEmail = primaryEmail,
            PrimaryPhone = primaryPhone,

            // Privacy settings
            DirectoryVisibility = profile.DirectoryVisibility,
            ShowInDirectory = profile.ShowInDirectory,
            ShowNameInDirectory = profile.ShowNameInDirectory,
            ShowUnitInDirectory = profile.ShowUnitInDirectory,
            ShowPhoneInDirectory = profile.ShowPhoneInDirectory,
            ShowEmailInDirectory = profile.ShowEmailInDirectory,
            ShowProfilePhotoInDirectory = profile.ShowProfilePhotoInDirectory,

            // Notification settings
            PushEnabled = profile.PushEnabled,
            EmailEnabled = profile.EmailEnabled,
            NotifyMaintenanceUpdates = profile.NotifyMaintenanceUpdates,
            NotifyAmenityBookings = profile.NotifyAmenityBookings,
            NotifyVisitorAtGate = profile.NotifyVisitorAtGate,
            NotifyAnnouncements = profile.NotifyAnnouncements,
            NotifyMarketplace = profile.NotifyMarketplace,

            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        };

        return Result<MyCommunityProfileDto>.Success(dto);
    }
}

