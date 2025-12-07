using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.AddStorySlide;

/// <summary>
/// Command to add a story slide creative to a campaign.
/// </summary>
public sealed record AddStorySlideCommand : IRequest<Result<Guid>>
{
    public Guid CampaignId { get; init; }
    public CreateStorySlideRequest Request { get; init; } = new();
}
