using MediatR;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetPlatformAnalyticsOverview;

/// <summary>
/// Query to get platform-wide analytics overview.
/// </summary>
public sealed record GetPlatformAnalyticsOverviewQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int TopCount = 5) : IRequest<Result<PlatformAnalyticsOverviewDto>>;
