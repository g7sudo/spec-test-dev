using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.AddStorySlide;

/// <summary>
/// Handler for AddStorySlideCommand.
/// </summary>
public sealed class AddStorySlideCommandHandler : IRequestHandler<AddStorySlideCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<AddStorySlideCommandHandler> _logger;

    public AddStorySlideCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<AddStorySlideCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(AddStorySlideCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        var campaign = await _platformDbContext.Campaigns
            .FirstOrDefaultAsync(x => x.Id == command.CampaignId && x.IsActive, cancellationToken);

        if (campaign == null)
        {
            return Result.Failure<Guid>("Campaign not found.");
        }

        if (campaign.Type != CampaignType.Story)
        {
            return Result.Failure<Guid>("Cannot add story slide to a non-story campaign.");
        }

        // Check if sequence is already used
        var sequenceExists = await _platformDbContext.CampaignCreatives
            .AnyAsync(c => c.CampaignId == command.CampaignId &&
                          c.Sequence == request.Sequence &&
                          c.IsActive, cancellationToken);

        if (sequenceExists)
        {
            return Result.Failure<Guid>($"Sequence {request.Sequence} is already used. Please use a different sequence number.");
        }

        _logger.LogInformation(
            "Adding story slide to campaign {CampaignId} at sequence {Sequence} by user {UserId}",
            command.CampaignId,
            request.Sequence,
            userId);

        var creative = CampaignCreative.CreateStorySlide(
            campaignId: command.CampaignId,
            mediaUrl: request.MediaUrl,
            sequence: request.Sequence,
            caption: request.Caption,
            ctaType: request.CTAType,
            ctaValue: request.CTAValue,
            createdBy: userId);

        _platformDbContext.Add(creative);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Added story slide {CreativeId} to campaign {CampaignId} at sequence {Sequence}",
            creative.Id,
            command.CampaignId,
            request.Sequence);

        return Result.Success(creative.Id);
    }
}
