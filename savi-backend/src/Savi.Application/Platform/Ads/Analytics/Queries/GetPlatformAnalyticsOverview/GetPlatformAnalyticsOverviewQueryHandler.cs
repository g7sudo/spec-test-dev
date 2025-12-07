using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetPlatformAnalyticsOverview;

/// <summary>
/// Handler for GetPlatformAnalyticsOverviewQuery.
/// </summary>
public sealed class GetPlatformAnalyticsOverviewQueryHandler : IRequestHandler<GetPlatformAnalyticsOverviewQuery, Result<PlatformAnalyticsOverviewDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetPlatformAnalyticsOverviewQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<PlatformAnalyticsOverviewDto>> Handle(GetPlatformAnalyticsOverviewQuery query, CancellationToken cancellationToken)
    {
        // Set date range - default to last 30 days
        var toDate = query.ToDate ?? DateTime.UtcNow;
        var fromDate = query.FromDate ?? toDate.AddDays(-30);

        // Get advertiser count
        var totalAdvertisers = await _platformDbContext.Advertisers
            .CountAsync(a => a.IsActive, cancellationToken);

        // Get campaign counts
        var totalCampaigns = await _platformDbContext.Campaigns
            .CountAsync(c => c.IsActive, cancellationToken);

        var activeCampaigns = await _platformDbContext.Campaigns
            .CountAsync(c => c.IsActive && c.Status == CampaignStatus.Active, cancellationToken);

        // Get overall event metrics
        var eventsQuery = _platformDbContext.AdEvents
            .AsNoTracking()
            .Where(e => e.OccurredAt >= fromDate && e.OccurredAt <= toDate);

        var totalImpressions = await eventsQuery
            .CountAsync(e => e.EventType == AdEventType.View, cancellationToken);

        var totalClicks = await eventsQuery
            .CountAsync(e => e.EventType == AdEventType.Click, cancellationToken);

        // Get top campaigns by impressions
        var topCampaignsByImpressions = await eventsQuery
            .Where(e => e.EventType == AdEventType.View)
            .GroupBy(e => e.CampaignId)
            .Select(g => new
            {
                CampaignId = g.Key,
                Impressions = g.Count()
            })
            .OrderByDescending(x => x.Impressions)
            .Take(query.TopCount)
            .ToListAsync(cancellationToken);

        // Get click counts for top campaigns
        var topCampaignIds = topCampaignsByImpressions.Select(c => c.CampaignId).ToList();
        var clicksByTopCampaigns = await eventsQuery
            .Where(e => topCampaignIds.Contains(e.CampaignId) && e.EventType == AdEventType.Click)
            .GroupBy(e => e.CampaignId)
            .Select(g => new { CampaignId = g.Key, Clicks = g.Count() })
            .ToDictionaryAsync(x => x.CampaignId, x => x.Clicks, cancellationToken);

        // Get campaign and advertiser details
        var campaignDetails = await _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(c => topCampaignIds.Contains(c.Id))
            .Join(_platformDbContext.Advertisers,
                c => c.AdvertiserId,
                a => a.Id,
                (c, a) => new { c.Id, CampaignName = c.Name, AdvertiserName = a.Name })
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var topCampaignsByImpressionsResult = topCampaignsByImpressions.Select(c =>
        {
            var details = campaignDetails.GetValueOrDefault(c.CampaignId);
            var clicks = clicksByTopCampaigns.GetValueOrDefault(c.CampaignId, 0);
            return new TopCampaignDto
            {
                CampaignId = c.CampaignId,
                CampaignName = details?.CampaignName ?? "Unknown",
                AdvertiserName = details?.AdvertiserName ?? "Unknown",
                Impressions = c.Impressions,
                Clicks = clicks,
                ClickThroughRate = CalculateCtr(c.Impressions, clicks)
            };
        }).ToList();

        // Get top campaigns by clicks
        var topCampaignsByClicks = await eventsQuery
            .Where(e => e.EventType == AdEventType.Click)
            .GroupBy(e => e.CampaignId)
            .Select(g => new
            {
                CampaignId = g.Key,
                Clicks = g.Count()
            })
            .OrderByDescending(x => x.Clicks)
            .Take(query.TopCount)
            .ToListAsync(cancellationToken);

        var topClickCampaignIds = topCampaignsByClicks.Select(c => c.CampaignId).ToList();
        var impressionsByTopClickCampaigns = await eventsQuery
            .Where(e => topClickCampaignIds.Contains(e.CampaignId) && e.EventType == AdEventType.View)
            .GroupBy(e => e.CampaignId)
            .Select(g => new { CampaignId = g.Key, Impressions = g.Count() })
            .ToDictionaryAsync(x => x.CampaignId, x => x.Impressions, cancellationToken);

        var topClickCampaignDetails = await _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(c => topClickCampaignIds.Contains(c.Id))
            .Join(_platformDbContext.Advertisers,
                c => c.AdvertiserId,
                a => a.Id,
                (c, a) => new { c.Id, CampaignName = c.Name, AdvertiserName = a.Name })
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var topCampaignsByClicksResult = topCampaignsByClicks.Select(c =>
        {
            var details = topClickCampaignDetails.GetValueOrDefault(c.CampaignId);
            var impressions = impressionsByTopClickCampaigns.GetValueOrDefault(c.CampaignId, 0);
            return new TopCampaignDto
            {
                CampaignId = c.CampaignId,
                CampaignName = details?.CampaignName ?? "Unknown",
                AdvertiserName = details?.AdvertiserName ?? "Unknown",
                Impressions = impressions,
                Clicks = c.Clicks,
                ClickThroughRate = CalculateCtr(impressions, c.Clicks)
            };
        }).ToList();

        // Get top tenants by impressions
        var topTenantsByImpressions = await eventsQuery
            .Where(e => e.EventType == AdEventType.View)
            .GroupBy(e => e.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                Impressions = g.Count()
            })
            .OrderByDescending(x => x.Impressions)
            .Take(query.TopCount)
            .ToListAsync(cancellationToken);

        var topTenantIds = topTenantsByImpressions.Select(t => t.TenantId).ToList();

        var clicksByTopTenants = await eventsQuery
            .Where(e => topTenantIds.Contains(e.TenantId) && e.EventType == AdEventType.Click)
            .GroupBy(e => e.TenantId)
            .Select(g => new { TenantId = g.Key, Clicks = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Clicks, cancellationToken);

        var tenantNames = await _platformDbContext.Tenants
            .AsNoTracking()
            .Where(t => topTenantIds.Contains(t.Id))
            .Select(t => new { t.Id, t.Name })
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);

        var activeCampaignsByTenant = await _platformDbContext.CampaignTargetTenants
            .AsNoTracking()
            .Where(t => topTenantIds.Contains(t.TenantId) && t.IsActive)
            .Join(_platformDbContext.Campaigns.Where(c => c.IsActive && c.Status == CampaignStatus.Active),
                t => t.CampaignId,
                c => c.Id,
                (t, c) => t.TenantId)
            .GroupBy(id => id)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, cancellationToken);

        var topTenantsResult = topTenantsByImpressions.Select(t => new TopTenantDto
        {
            TenantId = t.TenantId,
            TenantName = tenantNames.GetValueOrDefault(t.TenantId, "Unknown"),
            Impressions = t.Impressions,
            Clicks = clicksByTopTenants.GetValueOrDefault(t.TenantId, 0),
            ActiveCampaigns = activeCampaignsByTenant.GetValueOrDefault(t.TenantId, 0)
        }).ToList();

        // Get daily trend
        var dailyTrend = await eventsQuery
            .GroupBy(e => e.OccurredAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click)
            })
            .OrderBy(d => d.Date)
            .ToListAsync(cancellationToken);

        var dailyTrendResult = dailyTrend.Select(d => new DailyAnalyticsDto
        {
            Date = DateOnly.FromDateTime(d.Date),
            Impressions = d.Impressions,
            Clicks = d.Clicks,
            ClickThroughRate = CalculateCtr(d.Impressions, d.Clicks)
        }).ToList();

        var result = new PlatformAnalyticsOverviewDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            TotalAdvertisers = totalAdvertisers,
            TotalCampaigns = totalCampaigns,
            ActiveCampaigns = activeCampaigns,
            TotalImpressions = totalImpressions,
            TotalClicks = totalClicks,
            ClickThroughRate = CalculateCtr(totalImpressions, totalClicks),
            TopCampaignsByImpressions = topCampaignsByImpressionsResult,
            TopCampaignsByClicks = topCampaignsByClicksResult,
            TopTenantsByImpressions = topTenantsResult,
            DailyTrend = dailyTrendResult
        };

        return Result.Success(result);
    }

    private static decimal CalculateCtr(int impressions, int clicks)
    {
        if (impressions == 0) return 0;
        return Math.Round((decimal)clicks / impressions * 100, 2);
    }
}
