using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCampaign;

/// <summary>
/// Handler for DeleteCampaignCommand.
/// </summary>
public sealed class DeleteCampaignCommandHandler : IRequestHandler<DeleteCampaignCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeleteCampaignCommandHandler> _logger;

    public DeleteCampaignCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<DeleteCampaignCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteCampaignCommand command, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var campaign = await _platformDbContext.Campaigns
            .FirstOrDefaultAsync(x => x.Id == command.CampaignId && x.IsActive, cancellationToken);

        if (campaign == null)
        {
            return Result.Failure("Campaign not found.");
        }

        // Cannot delete active campaigns
        if (campaign.Status == CampaignStatus.Active)
        {
            return Result.Failure("Cannot delete an active campaign. Please pause or end it first.");
        }

        _logger.LogInformation(
            "Deleting campaign {CampaignId} by user {UserId}",
            command.CampaignId,
            userId);

        // Soft-delete the campaign
        campaign.Deactivate(userId);

        // Soft-delete all target tenants
        var targets = await _platformDbContext.CampaignTargetTenants
            .Where(t => t.CampaignId == command.CampaignId && t.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var target in targets)
        {
            target.Deactivate(userId);
        }

        // Soft-delete all creatives
        var creatives = await _platformDbContext.CampaignCreatives
            .Where(c => c.CampaignId == command.CampaignId && c.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var creative in creatives)
        {
            creative.Deactivate(userId);
        }

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Deleted campaign {CampaignId} with {TargetCount} targets and {CreativeCount} creatives",
            command.CampaignId,
            targets.Count,
            creatives.Count);

        return Result.Success();
    }
}
