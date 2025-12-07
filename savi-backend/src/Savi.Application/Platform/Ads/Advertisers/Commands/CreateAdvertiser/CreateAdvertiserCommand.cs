using MediatR;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Commands.CreateAdvertiser;

/// <summary>
/// Command to create a new advertiser.
/// </summary>
public sealed record CreateAdvertiserCommand : IRequest<Result<Guid>>
{
    public CreateAdvertiserRequest Request { get; init; } = new();
}
