using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Queries.GetBanners;

/// <summary>
/// Handler for GetBannersQuery.
/// </summary>
public sealed class GetBannersQueryHandler : IRequestHandler<GetBannersQuery, Result<GetBannersResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetBannersQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<GetBannersResponse>> Handle(GetBannersQuery query, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Get active banner campaigns for this tenant
        var eligibleCampaignIds = await _platformDbContext.CampaignTargetTenants
            .AsNoTracking()
            .Where(t => t.TenantId == query.TenantId && t.IsActive)
            .Join(
                _platformDbContext.Campaigns
                    .Where(c => c.IsActive &&
                               c.Type == CampaignType.Banner &&
                               c.Status == CampaignStatus.Active &&
                               c.StartsAt <= now &&
                               (c.EndsAt == null || c.EndsAt > now)),
                t => t.CampaignId,
                c => c.Id,
                (t, c) => new { c.Id, c.Priority })
            .OrderByDescending(x => x.Priority)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var placements = new List<BannerPlacementDto>();

        foreach (var placement in query.Placements)
        {
            // Get the highest priority creative for this placement
            var creative = await _platformDbContext.CampaignCreatives
                .AsNoTracking()
                .Where(c => eligibleCampaignIds.Contains(c.CampaignId) &&
                           c.IsActive &&
                           c.Type == CreativeType.Banner &&
                           c.Placement == placement)
                .Join(
                    _platformDbContext.Campaigns,
                    cr => cr.CampaignId,
                    ca => ca.Id,
                    (cr, ca) => new { Creative = cr, Campaign = ca })
                .OrderByDescending(x => x.Campaign.Priority)
                .Select(x => new BannerCreativeDto
                {
                    CreativeId = x.Creative.Id,
                    CampaignId = x.Creative.CampaignId,
                    ImageUrl = x.Creative.MediaUrl,
                    Caption = x.Creative.Caption,
                    CTAType = x.Creative.CTAType,
                    CTAValue = x.Creative.CTAValue,
                    SizeCode = x.Creative.SizeCode
                })
                .FirstOrDefaultAsync(cancellationToken);

            placements.Add(new BannerPlacementDto
            {
                Placement = placement,
                Creative = creative
            });
        }

        var response = new GetBannersResponse
        {
            TenantId = query.TenantId,
            Screen = query.Screen,
            Placements = placements
        };

        return Result.Success(response);
    }
}
