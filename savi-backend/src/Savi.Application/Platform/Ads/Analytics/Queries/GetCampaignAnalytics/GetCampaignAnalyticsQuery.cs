using MediatR;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetCampaignAnalytics;

/// <summary>
/// Query to get analytics for a specific campaign.
/// </summary>
public sealed record GetCampaignAnalyticsQuery(
    Guid CampaignId,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<Result<CampaignAnalyticsDto>>;
