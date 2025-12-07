using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignCreatives;

/// <summary>
/// Query to get creatives for a campaign.
/// </summary>
public sealed record GetCampaignCreativesQuery(Guid CampaignId) : IRequest<Result<List<CampaignCreativeDto>>>;
