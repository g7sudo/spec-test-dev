using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.ListCampaigns;

/// <summary>
/// Handler for ListCampaignsQuery.
/// </summary>
public sealed class ListCampaignsQueryHandler : IRequestHandler<ListCampaignsQuery, Result<PagedResult<CampaignDto>>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public ListCampaignsQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<PagedResult<CampaignDto>>> Handle(ListCampaignsQuery query, CancellationToken cancellationToken)
    {
        var baseQuery = _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(x => x.IsActive);

        // Apply filters
        if (query.AdvertiserId.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.AdvertiserId == query.AdvertiserId.Value);
        }

        if (query.Type.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.Type == query.Type.Value);
        }

        if (query.Status.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.Status == query.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Name.ToLower().Contains(searchTerm) ||
                (x.Advertiser != null && x.Advertiser.Name.ToLower().Contains(searchTerm)));
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new CampaignDto
            {
                Id = x.Id,
                AdvertiserId = x.AdvertiserId,
                AdvertiserName = x.Advertiser != null ? x.Advertiser.Name : string.Empty,
                Name = x.Name,
                Type = x.Type,
                Status = x.Status,
                StartsAt = x.StartsAt,
                EndsAt = x.EndsAt,
                MaxImpressions = x.MaxImpressions,
                MaxClicks = x.MaxClicks,
                DailyImpressionCap = x.DailyImpressionCap,
                Priority = x.Priority,
                Notes = x.Notes,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                CreativeCount = x.Creatives.Count(c => c.IsActive),
                TargetTenantCount = x.TargetTenants.Count(t => t.IsActive),
                TargetTenantIds = x.TargetTenants.Where(t => t.IsActive).Select(t => t.TenantId).ToList()
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<CampaignDto>(
            items,
            totalCount,
            query.Page,
            query.PageSize);

        return Result.Success(pagedResult);
    }
}
