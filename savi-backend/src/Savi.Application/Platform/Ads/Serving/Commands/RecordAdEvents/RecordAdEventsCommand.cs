using MediatR;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Commands.RecordAdEvents;

/// <summary>
/// Command to record ad events (views and clicks) in batch.
/// </summary>
public sealed record RecordAdEventsCommand : IRequest<Result<RecordAdEventsResponse>>
{
    public RecordAdEventsRequest Request { get; init; } = new();
}
