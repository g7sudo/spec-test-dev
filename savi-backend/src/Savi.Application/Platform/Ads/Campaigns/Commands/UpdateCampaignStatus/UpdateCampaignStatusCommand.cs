using MediatR;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.UpdateCampaignStatus;

/// <summary>
/// Command to update a campaign's status.
/// </summary>
public sealed record UpdateCampaignStatusCommand(Guid CampaignId, CampaignStatus Status) : IRequest<Result>;
