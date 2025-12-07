using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.CreateCampaign;

/// <summary>
/// Command to create a new campaign.
/// </summary>
public sealed record CreateCampaignCommand : IRequest<Result<Guid>>
{
    public CreateCampaignRequest Request { get; init; } = new();
}
