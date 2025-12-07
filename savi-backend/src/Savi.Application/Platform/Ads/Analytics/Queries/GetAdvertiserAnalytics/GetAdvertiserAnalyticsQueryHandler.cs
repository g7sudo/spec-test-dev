using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetAdvertiserAnalytics;

/// <summary>
/// Handler for GetAdvertiserAnalyticsQuery.
/// </summary>
public sealed class GetAdvertiserAnalyticsQueryHandler : IRequestHandler<GetAdvertiserAnalyticsQuery, Result<AdvertiserAnalyticsDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetAdvertiserAnalyticsQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<AdvertiserAnalyticsDto>> Handle(GetAdvertiserAnalyticsQuery query, CancellationToken cancellationToken)
    {
        // Get advertiser details
        var advertiser = await _platformDbContext.Advertisers
            .AsNoTracking()
            .Where(a => a.Id == query.AdvertiserId && a.IsActive)
            .Select(a => new { a.Id, a.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (advertiser == null)
        {
            return Result.Failure<AdvertiserAnalyticsDto>("Advertiser not found.");
        }

        // Set date range
        var fromDate = query.FromDate ?? DateTime.UtcNow.AddMonths(-3);
        var toDate = query.ToDate ?? DateTime.UtcNow;

        // Get all campaigns for this advertiser
        var campaigns = await _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(c => c.AdvertiserId == query.AdvertiserId && c.IsActive)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Type,
                c.Status,
                c.StartsAt,
                c.EndsAt
            })
            .ToListAsync(cancellationToken);

        var campaignIds = campaigns.Select(c => c.Id).ToList();

        // Get event metrics for all campaigns
        var campaignMetrics = await _platformDbContext.AdEvents
            .AsNoTracking()
            .Where(e => campaignIds.Contains(e.CampaignId) &&
                       e.OccurredAt >= fromDate &&
                       e.OccurredAt <= toDate)
            .GroupBy(e => e.CampaignId)
            .Select(g => new
            {
                CampaignId = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click)
            })
            .ToDictionaryAsync(m => m.CampaignId, cancellationToken);

        // Build campaign summaries
        var campaignSummaries = campaigns.Select(c =>
        {
            var metrics = campaignMetrics.GetValueOrDefault(c.Id);
            var impressions = metrics?.Impressions ?? 0;
            var clicks = metrics?.Clicks ?? 0;

            return new CampaignSummaryDto
            {
                CampaignId = c.Id,
                Name = c.Name,
                Type = c.Type,
                Status = c.Status,
                StartsAt = c.StartsAt,
                EndsAt = c.EndsAt,
                Impressions = impressions,
                Clicks = clicks,
                ClickThroughRate = CalculateCtr(impressions, clicks)
            };
        }).OrderByDescending(c => c.Impressions).ToList();

        // Calculate totals
        var totalImpressions = campaignSummaries.Sum(c => c.Impressions);
        var totalClicks = campaignSummaries.Sum(c => c.Clicks);
        var activeCampaigns = campaigns.Count(c => c.Status == CampaignStatus.Active);

        var result = new AdvertiserAnalyticsDto
        {
            AdvertiserId = advertiser.Id,
            AdvertiserName = advertiser.Name,
            TotalCampaigns = campaigns.Count,
            ActiveCampaigns = activeCampaigns,
            TotalImpressions = totalImpressions,
            TotalClicks = totalClicks,
            ClickThroughRate = CalculateCtr(totalImpressions, totalClicks),
            Campaigns = campaignSummaries
        };

        return Result.Success(result);
    }

    private static decimal CalculateCtr(int impressions, int clicks)
    {
        if (impressions == 0) return 0;
        return Math.Round((decimal)clicks / impressions * 100, 2);
    }
}
