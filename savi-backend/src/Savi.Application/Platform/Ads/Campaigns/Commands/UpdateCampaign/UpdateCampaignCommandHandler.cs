using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaign;

/// <summary>
/// Handler for UpdateCampaignCommand.
/// </summary>
public sealed class UpdateCampaignCommandHandler : IRequestHandler<UpdateCampaignCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateCampaignCommandHandler> _logger;

    public UpdateCampaignCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UpdateCampaignCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(UpdateCampaignCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        var campaign = await _platformDbContext.Campaigns
            .FirstOrDefaultAsync(x => x.Id == command.CampaignId && x.IsActive, cancellationToken);

        if (campaign == null)
        {
            return Result.Failure<Guid>("Campaign not found.");
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
            "Updating campaign {CampaignId} by user {UserId}",
            command.CampaignId,
            userId);

        campaign.Update(
            name: request.Name,
            startsAt: request.StartsAt,
            endsAt: request.EndsAt,
            maxImpressions: request.MaxImpressions,
            maxClicks: request.MaxClicks,
            dailyImpressionCap: request.DailyImpressionCap,
            priority: request.Priority,
            notes: request.Notes,
            updatedBy: userId);

        // Update target tenants - get current targets
        var currentTargets = await _platformDbContext.CampaignTargetTenants
            .Where(t => t.CampaignId == command.CampaignId && t.IsActive)
            .ToListAsync(cancellationToken);

        var currentTenantIds = currentTargets.Select(t => t.TenantId).ToHashSet();
        var newTenantIds = request.TargetTenantIds.ToHashSet();

        // Remove targets no longer in list
        foreach (var target in currentTargets.Where(t => !newTenantIds.Contains(t.TenantId)))
        {
            target.Deactivate(userId);
        }

        // Add new targets
        foreach (var tenantId in newTenantIds.Where(id => !currentTenantIds.Contains(id)))
        {
            var newTarget = CampaignTargetTenant.Create(command.CampaignId, tenantId, userId);
            _platformDbContext.Add(newTarget);
        }

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated campaign {CampaignId}",
            campaign.Id);

        return Result.Success(campaign.Id);
    }
}
