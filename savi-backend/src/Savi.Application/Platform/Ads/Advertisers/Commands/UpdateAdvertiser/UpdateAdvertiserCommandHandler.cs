using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.UpdateAdvertiser;

/// <summary>
/// Handler for UpdateAdvertiserCommand.
/// </summary>
public sealed class UpdateAdvertiserCommandHandler : IRequestHandler<UpdateAdvertiserCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<UpdateAdvertiserCommandHandler> _logger;

    public UpdateAdvertiserCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<UpdateAdvertiserCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(UpdateAdvertiserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        var advertiser = await _platformDbContext.Advertisers
            .FirstOrDefaultAsync(x => x.Id == command.AdvertiserId && x.IsActive, cancellationToken);

        if (advertiser == null)
        {
            return Result.Failure<Guid>("Advertiser not found.");
        }

        _logger.LogInformation(
            "Updating advertiser {AdvertiserId} by user {UserId}",
            command.AdvertiserId,
            userId);

        advertiser.Update(
            name: request.Name,
            contactName: request.ContactName,
            contactEmail: request.ContactEmail,
            contactPhone: request.ContactPhone,
            notes: request.Notes,
            updatedBy: userId);

        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated advertiser {AdvertiserId}",
            advertiser.Id);

        return Result.Success(advertiser.Id);
    }
}
