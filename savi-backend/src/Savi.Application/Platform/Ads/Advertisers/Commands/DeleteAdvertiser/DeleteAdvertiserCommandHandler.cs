using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.DeleteAdvertiser;

/// <summary>
/// Handler for DeleteAdvertiserCommand.
/// </summary>
public sealed class DeleteAdvertiserCommandHandler : IRequestHandler<DeleteAdvertiserCommand, Result>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<DeleteAdvertiserCommandHandler> _logger;

    public DeleteAdvertiserCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<DeleteAdvertiserCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteAdvertiserCommand command, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var advertiser = await _platformDbContext.Advertisers
            .FirstOrDefaultAsync(x => x.Id == command.AdvertiserId && x.IsActive, cancellationToken);

        if (advertiser == null)
        {
            return Result.Failure("Advertiser not found.");
        }

        // Check if advertiser has active campaigns
        var hasActiveCampaigns = await _platformDbContext.Campaigns
            .AnyAsync(c => c.AdvertiserId == command.AdvertiserId && c.IsActive, cancellationToken);

        if (hasActiveCampaigns)
        {
            return Result.Failure("Cannot delete advertiser with active campaigns. Please end or delete all campaigns first.");
        }

        _logger.LogInformation(
            "Deleting advertiser {AdvertiserId} by user {UserId}",
            command.AdvertiserId,
            userId);

        advertiser.Deactivate(userId);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Deleted advertiser {AdvertiserId}",
            command.AdvertiserId);

        return Result.Success();
    }
}
