using MediatR;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetAdvertiserAnalytics;

/// <summary>
/// Query to get analytics for a specific advertiser across all their campaigns.
/// </summary>
public sealed record GetAdvertiserAnalyticsQuery(
    Guid AdvertiserId,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<Result<AdvertiserAnalyticsDto>>;
