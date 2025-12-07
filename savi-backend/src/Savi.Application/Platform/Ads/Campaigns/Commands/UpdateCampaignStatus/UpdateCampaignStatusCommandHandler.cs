using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaignStatus;

/// <summary>
/// Handler for UpdateCampaignStatusCommand.
/// </summary>
public sealed class UpdateCampaignStatusCommandHandler : IRequestHandler<UpdateCampaignStatusCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateCampaignStatusCommandHandler> _logger;

    public UpdateCampaignStatusCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UpdateCampaignStatusCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(UpdateCampaignStatusCommand command, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var campaign = await _platformDbContext.Campaigns
            .FirstOrDefaultAsync(x => x.Id == command.CampaignId && x.IsActive, cancellationToken);

        if (campaign == null)
        {
            return Result.Failure("Campaign not found.");
        }

        // Validate status transition
        var validTransition = IsValidStatusTransition(campaign.Status, command.Status);
        if (!validTransition)
        {
            return Result.Failure($"Cannot transition from {campaign.Status} to {command.Status}.");
        }

        // If activating, check for creatives
        if (command.Status == CampaignStatus.Active)
        {
            var hasCreatives = await _platformDbContext.CampaignCreatives
                .AnyAsync(c => c.CampaignId == command.CampaignId && c.IsActive, cancellationToken);

            if (!hasCreatives)
            {
                return Result.Failure("Cannot activate campaign without creatives.");
            }
        }

        _logger.LogInformation(
            "Updating campaign {CampaignId} status from {OldStatus} to {NewStatus} by user {UserId}",
            command.CampaignId,
            campaign.Status,
            command.Status,
            userId);

        campaign.UpdateStatus(command.Status, userId);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated campaign {CampaignId} status to {Status}",
            campaign.Id,
            command.Status);

        return Result.Success();
    }

    private static bool IsValidStatusTransition(CampaignStatus current, CampaignStatus target)
    {
        return (current, target) switch
        {
            (CampaignStatus.Draft, CampaignStatus.Active) => true,
            (CampaignStatus.Active, CampaignStatus.Paused) => true,
            (CampaignStatus.Active, CampaignStatus.Ended) => true,
            (CampaignStatus.Paused, CampaignStatus.Active) => true,
            (CampaignStatus.Paused, CampaignStatus.Ended) => true,
            _ => false
        };
    }
}
