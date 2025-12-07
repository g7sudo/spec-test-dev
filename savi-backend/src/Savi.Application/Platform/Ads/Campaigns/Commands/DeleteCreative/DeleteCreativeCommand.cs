using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Commands.DeleteCreative;

/// <summary>
/// Command to soft-delete a campaign creative.
/// </summary>
public sealed record DeleteCreativeCommand(Guid CreativeId) : IRequest<Result>;
