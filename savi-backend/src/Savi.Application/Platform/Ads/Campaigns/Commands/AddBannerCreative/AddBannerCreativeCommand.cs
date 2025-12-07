using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.AddBannerCreative;

/// <summary>
/// Command to add a banner creative to a campaign.
/// </summary>
public sealed record AddBannerCreativeCommand : IRequest<Result<Guid>>
{
    public Guid CampaignId { get; init; }
    public CreateBannerCreativeRequest Request { get; init; } = new();
}
