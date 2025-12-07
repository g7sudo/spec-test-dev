using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaign;

/// <summary>
/// Command to update a campaign.
/// </summary>
public sealed record UpdateCampaignCommand : IRequest<Result<Guid>>
{
    public Guid CampaignId { get; init; }
    public UpdateCampaignRequest Request { get; init; } = new();
}
