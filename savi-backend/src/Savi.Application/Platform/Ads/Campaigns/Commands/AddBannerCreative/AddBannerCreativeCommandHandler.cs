using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.AddBannerCreative;

/// <summary>
/// Handler for AddBannerCreativeCommand.
/// </summary>
public sealed class AddBannerCreativeCommandHandler : IRequestHandler<AddBannerCreativeCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AddBannerCreativeCommandHandler> _logger;

    public AddBannerCreativeCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<AddBannerCreativeCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(AddBannerCreativeCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        var campaign = await _platformDbContext.Campaigns
            .FirstOrDefaultAsync(x => x.Id == command.CampaignId && x.IsActive, cancellationToken);

        if (campaign == null)
        {
            return Result.Failure<Guid>("Campaign not found.");
        }

        if (campaign.Type != CampaignType.Banner)
        {
            return Result.Failure<Guid>("Cannot add banner creative to a non-banner campaign.");
        }

        _logger.LogInformation(
            "Adding banner creative to campaign {CampaignId} at placement {Placement} by user {UserId}",
            command.CampaignId,
            request.Placement,
            userId);

        var creative = CampaignCreative.CreateBanner(
            campaignId: command.CampaignId,
            mediaUrl: request.MediaUrl,
            placement: request.Placement,
            sizeCode: request.SizeCode,
            caption: request.Caption,
            ctaType: request.CTAType,
            ctaValue: request.CTAValue,
            createdBy: userId);

        _platformDbContext.Add(creative);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Added banner creative {CreativeId} to campaign {CampaignId}",
            creative.Id,
            command.CampaignId);

        return Result.Success(creative.Id);
    }
}
