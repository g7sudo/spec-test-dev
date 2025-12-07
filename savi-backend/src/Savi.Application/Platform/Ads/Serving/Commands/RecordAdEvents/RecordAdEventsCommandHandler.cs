using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.Domain.Platform;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Commands.RecordAdEvents;

/// <summary>
/// Handler for RecordAdEventsCommand.
/// </summary>
public sealed class RecordAdEventsCommandHandler : IRequestHandler<RecordAdEventsCommand, Result<RecordAdEventsResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;
    private readonly ILogger<RecordAdEventsCommandHandler> _logger;

    public RecordAdEventsCommandHandler(
        IPlatformDbContext platformDbContext,
        ILogger<RecordAdEventsCommandHandler> logger)
    {
        _platformDbContext = platformDbContext;
        _logger = logger;
    }

    public async Task<Result<RecordAdEventsResponse>> Handle(RecordAdEventsCommand command, CancellationToken cancellationToken)
    {
        var events = command.Request.Events;
        var accepted = 0;
        var rejected = 0;

        // Get valid campaign and creative IDs
        var campaignIds = events.Select(e => e.CampaignId).Distinct().ToList();
        var creativeIds = events.Select(e => e.CreativeId).Distinct().ToList();

        var validCampaignIds = await _platformDbContext.Campaigns
            .Where(c => campaignIds.Contains(c.Id) && c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        var validCreativeIds = await _platformDbContext.CampaignCreatives
            .Where(c => creativeIds.Contains(c.Id) && c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        foreach (var eventRequest in events)
        {
            // Validate campaign and creative exist
            if (!validCampaignIds.Contains(eventRequest.CampaignId) ||
                !validCreativeIds.Contains(eventRequest.CreativeId))
            {
                rejected++;
                continue;
            }

            // Parse event type
            if (!Enum.TryParse<AdEventType>(eventRequest.EventType, true, out var eventType))
            {
                rejected++;
                continue;
            }

            // Parse placement if provided
            AdPlacement? placement = null;
            if (!string.IsNullOrEmpty(eventRequest.Placement) &&
                Enum.TryParse<AdPlacement>(eventRequest.Placement, true, out var parsedPlacement))
            {
                placement = parsedPlacement;
            }

            var adEvent = AdEvent.Create(
                campaignId: eventRequest.CampaignId,
                creativeId: eventRequest.CreativeId,
                tenantId: eventRequest.TenantId,
                eventType: eventType,
                occurredAt: eventRequest.OccurredAt,
                platformUserId: eventRequest.UserId,
                screen: eventRequest.Screen,
                placement: placement);

            _platformDbContext.Add(adEvent);
            accepted++;
        }

        if (accepted > 0)
        {
            await _platformDbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Recorded {AcceptedCount} ad events, rejected {RejectedCount}",
                accepted,
                rejected);
        }

        return Result.Success(new RecordAdEventsResponse
        {
            Status = "ok",
            Accepted = accepted,
            Rejected = rejected
        });
    }
}
