using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.DeleteAdvertiser;

/// <summary>
/// Command to soft-delete an advertiser.
/// </summary>
public sealed record DeleteAdvertiserCommand(Guid AdvertiserId) : IRequest<Result>;
