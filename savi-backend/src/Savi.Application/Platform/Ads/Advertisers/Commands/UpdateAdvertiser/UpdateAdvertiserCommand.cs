using MediatR;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.UpdateAdvertiser;

/// <summary>
/// Command to update an existing advertiser.
/// </summary>
public sealed record UpdateAdvertiserCommand : IRequest<Result<Guid>>
{
    public Guid AdvertiserId { get; init; }
    public UpdateAdvertiserRequest Request { get; init; } = new();
}
