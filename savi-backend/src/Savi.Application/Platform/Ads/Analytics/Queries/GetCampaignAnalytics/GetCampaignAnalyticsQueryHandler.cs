using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Analytics.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Analytics.Queries.GetCampaignAnalytics;

/// <summary>
/// Handler for GetCampaignAnalyticsQuery.
/// </summary>
public sealed class GetCampaignAnalyticsQueryHandler : IRequestHandler<GetCampaignAnalyticsQuery, Result<CampaignAnalyticsDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetCampaignAnalyticsQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<CampaignAnalyticsDto>> Handle(GetCampaignAnalyticsQuery query, CancellationToken cancellationToken)
    {
        // Get campaign details
        var campaign = await _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(c => c.Id == query.CampaignId && c.IsActive)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Type,
                c.Status,
                c.StartsAt,
                c.EndsAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (campaign == null)
        {
            return Result.Failure<CampaignAnalyticsDto>("Campaign not found.");
        }

        // Set date range - default to campaign dates if not specified
        var fromDate = query.FromDate ?? campaign.StartsAt;
        var toDate = query.ToDate ?? DateTime.UtcNow;

        // Build base query for events
        var eventsQuery = _platformDbContext.AdEvents
            .AsNoTracking()
            .Where(e => e.CampaignId == query.CampaignId &&
                       e.OccurredAt >= fromDate &&
                       e.OccurredAt <= toDate);

        // Get overall metrics
        var totalImpressions = await eventsQuery
            .CountAsync(e => e.EventType == AdEventType.View, cancellationToken);

        var totalClicks = await eventsQuery
            .CountAsync(e => e.EventType == AdEventType.Click, cancellationToken);

        var uniqueUsers = await eventsQuery
            .Where(e => e.PlatformUserId != null)
            .Select(e => e.PlatformUserId)
            .Distinct()
            .CountAsync(cancellationToken);

        // Get tenant breakdown
        var tenantMetrics = await eventsQuery
            .GroupBy(e => e.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click),
                UniqueUsers = g.Where(e => e.PlatformUserId != null)
                              .Select(e => e.PlatformUserId)
                              .Distinct()
                              .Count()
            })
            .ToListAsync(cancellationToken);

        // Get tenant names
        var tenantIds = tenantMetrics.Select(t => t.TenantId).ToList();
        var tenantNames = await _platformDbContext.Tenants
            .AsNoTracking()
            .Where(t => tenantIds.Contains(t.Id))
            .Select(t => new { t.Id, t.Name })
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);

        var byTenant = tenantMetrics.Select(t => new TenantAnalyticsDto
        {
            TenantId = t.TenantId,
            TenantName = tenantNames.GetValueOrDefault(t.TenantId, "Unknown"),
            Impressions = t.Impressions,
            Clicks = t.Clicks,
            ClickThroughRate = CalculateCtr(t.Impressions, t.Clicks),
            UniqueUsers = t.UniqueUsers
        }).OrderByDescending(t => t.Impressions).ToList();

        // Get placement breakdown
        var placementMetrics = await eventsQuery
            .Where(e => e.Placement != null)
            .GroupBy(e => e.Placement)
            .Select(g => new
            {
                Placement = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click)
            })
            .ToListAsync(cancellationToken);

        var byPlacement = placementMetrics.Select(p => new PlacementAnalyticsDto
        {
            Placement = p.Placement?.ToString() ?? "Unknown",
            Impressions = p.Impressions,
            Clicks = p.Clicks,
            ClickThroughRate = CalculateCtr(p.Impressions, p.Clicks)
        }).OrderByDescending(p => p.Impressions).ToList();

        // Get creative breakdown
        var creativeMetrics = await eventsQuery
            .GroupBy(e => e.CreativeId)
            .Select(g => new
            {
                CreativeId = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click)
            })
            .ToListAsync(cancellationToken);

        // Get creative details
        var creativeIds = creativeMetrics.Select(c => c.CreativeId).ToList();
        var creativeDetails = await _platformDbContext.CampaignCreatives
            .AsNoTracking()
            .Where(c => creativeIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Type, c.Placement, c.Sequence })
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var byCreative = creativeMetrics.Select(c =>
        {
            var details = creativeDetails.GetValueOrDefault(c.CreativeId);
            return new CreativeAnalyticsDto
            {
                CreativeId = c.CreativeId,
                Type = details?.Type ?? CreativeType.Banner,
                Placement = details?.Placement?.ToString(),
                Sequence = details?.Sequence,
                Impressions = c.Impressions,
                Clicks = c.Clicks,
                ClickThroughRate = CalculateCtr(c.Impressions, c.Clicks)
            };
        }).OrderByDescending(c => c.Impressions).ToList();

        // Get daily breakdown
        var dailyMetrics = await eventsQuery
            .GroupBy(e => e.OccurredAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Impressions = g.Count(e => e.EventType == AdEventType.View),
                Clicks = g.Count(e => e.EventType == AdEventType.Click)
            })
            .OrderBy(d => d.Date)
            .ToListAsync(cancellationToken);

        var byDate = dailyMetrics.Select(d => new DailyAnalyticsDto
        {
            Date = DateOnly.FromDateTime(d.Date),
            Impressions = d.Impressions,
            Clicks = d.Clicks,
            ClickThroughRate = CalculateCtr(d.Impressions, d.Clicks)
        }).ToList();

        var result = new CampaignAnalyticsDto
        {
            CampaignId = campaign.Id,
            CampaignName = campaign.Name,
            Type = campaign.Type,
            Status = campaign.Status,
            StartsAt = campaign.StartsAt,
            EndsAt = campaign.EndsAt,
            TotalImpressions = totalImpressions,
            TotalClicks = totalClicks,
            ClickThroughRate = CalculateCtr(totalImpressions, totalClicks),
            UniqueUsers = uniqueUsers,
            ByTenant = byTenant,
            ByPlacement = byPlacement,
            ByCreative = byCreative,
            ByDate = byDate
        };

        return Result.Success(result);
    }

    private static decimal CalculateCtr(int impressions, int clicks)
    {
        if (impressions == 0) return 0;
        return Math.Round((decimal)clicks / impressions * 100, 2);
    }
}
