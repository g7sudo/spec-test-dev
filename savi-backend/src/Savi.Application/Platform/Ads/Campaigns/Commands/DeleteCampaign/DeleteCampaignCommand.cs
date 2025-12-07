using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCampaign;

/// <summary>
/// Command to soft-delete a campaign.
/// </summary>
public sealed record DeleteCampaignCommand(Guid CampaignId) : IRequest<Result>;
