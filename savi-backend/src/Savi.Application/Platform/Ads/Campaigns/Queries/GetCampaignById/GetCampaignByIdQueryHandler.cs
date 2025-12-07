using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignById;

/// <summary>
/// Handler for GetCampaignByIdQuery.
/// </summary>
public sealed class GetCampaignByIdQueryHandler : IRequestHandler<GetCampaignByIdQuery, Result<CampaignDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetCampaignByIdQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<CampaignDto>> Handle(GetCampaignByIdQuery query, CancellationToken cancellationToken)
    {
        var campaign = await _platformDbContext.Campaigns
            .AsNoTracking()
            .Where(x => x.Id == query.CampaignId && x.IsActive)
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
            .FirstOrDefaultAsync(cancellationToken);

        if (campaign == null)
        {
            return Result.Failure<CampaignDto>("Campaign not found.");
        }

        return Result.Success(campaign);
    }
}
