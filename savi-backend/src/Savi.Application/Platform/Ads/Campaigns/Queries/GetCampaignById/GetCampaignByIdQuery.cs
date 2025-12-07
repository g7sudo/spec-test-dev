using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignById;

/// <summary>
/// Query to get a campaign by ID with creatives.
/// </summary>
public sealed record GetCampaignByIdQuery(Guid CampaignId) : IRequest<Result<CampaignDto>>;
