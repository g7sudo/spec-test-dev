using MediatR;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Queries.GetAdvertiserById;

/// <summary>
/// Query to get an advertiser by ID.
/// </summary>
public sealed record GetAdvertiserByIdQuery(Guid AdvertiserId) : IRequest<Result<AdvertiserDto>>;
