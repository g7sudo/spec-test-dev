using MediatR;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Platform;
using Savi.SharedKernel.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.CreateAdvertiser;

/// <summary>
/// Handler for CreateAdvertiserCommand.
/// </summary>
public sealed class CreateAdvertiserCommandHandler : IRequestHandler<CreateAdvertiserCommand, Result<Guid>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<CreateAdvertiserCommandHandler> _logger;

    public CreateAdvertiserCommandHandler(
        IPlatformDbContext platformDbContext,
        ICurrentUser currentUser,
        ILogger<CreateAdvertiserCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateAdvertiserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = _currentUser.UserId;

        _logger.LogInformation(
            "Creating advertiser {AdvertiserName} by user {UserId}",
            request.Name,
            userId);

        var advertiser = Advertiser.Create(
            name: request.Name,
            contactName: request.ContactName,
            contactEmail: request.ContactEmail,
            contactPhone: request.ContactPhone,
            notes: request.Notes,
            createdBy: userId);

        _platformDbContext.Add(advertiser);
        await _platformDbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created advertiser {AdvertiserId} with name {AdvertiserName}",
            advertiser.Id,
            advertiser.Name);

        return Result.Success(advertiser.Id);
    }
}
