using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.CreateCampaign;

/// <summary>
/// Handler for CreateCampaignCommand.
/// </summary>
public sealed class CreateCampaignCommandHandler : IRequestHandler<CreateCampaignCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<CreateCampaignCommandHandler> _logger;

    public CreateCampaignCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<CreateCampaignCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateCampaignCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        // Verify advertiser exists
        var advertiserExists = await _platformDbContext.Advertisers
            .AnyAsync(x => x.Id == request.AdvertiserId && x.IsActive, cancellationToken);

        if (!advertiserExists)
        {
            return Result.Failure<Guid>("Advertiser not found.");
        }

        // Verify target tenants exist
        var validTenantIds = await _platformDbContext.Tenants
            .Where(t => request.TargetTenantIds.Contains(t.Id) && t.IsActive)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        if (validTenantIds.Count != request.TargetTenantIds.Count)
        {
            return Result.Failure<Guid>("One or more target tenants are invalid.");
        }

        _logger.LogInformation(
            "Creating campaign {CampaignName} for advertiser {AdvertiserId} by user {UserId}",
            request.Name,
            request.AdvertiserId,
            userId);

        var campaign = Campaign.Create(
            advertiserId: request.AdvertiserId,
            name: request.Name,
            type: request.Type,
            startsAt: request.StartsAt,
            endsAt: request.EndsAt,
            maxImpressions: request.MaxImpressions,
            maxClicks: request.MaxClicks,
            dailyImpressionCap: request.DailyImpressionCap,
            priority: request.Priority,
            notes: request.Notes,
            createdBy: userId);

        _platformDbContext.Add(campaign);

        // Add target tenants
        foreach (var tenantId in request.TargetTenantIds)
        {
            var target = CampaignTargetTenant.Create(campaign.Id, tenantId, userId);
            _platformDbContext.Add(target);
        }

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created campaign {CampaignId} with {TenantCount} target tenants",
            campaign.Id,
            request.TargetTenantIds.Count);

        return Result.Success(campaign.Id);
    }
}
