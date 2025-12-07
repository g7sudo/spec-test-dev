using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.GetCampaignCreatives;

/// <summary>
/// Handler for GetCampaignCreativesQuery.
/// </summary>
public sealed class GetCampaignCreativesQueryHandler : IRequestHandler<GetCampaignCreativesQuery, Result<List<CampaignCreativeDto>>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetCampaignCreativesQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<List<CampaignCreativeDto>>> Handle(GetCampaignCreativesQuery query, CancellationToken cancellationToken)
    {
        // Verify campaign exists
        var campaignExists = await _platformDbContext.Campaigns
            .AnyAsync(x => x.Id == query.CampaignId && x.IsActive, cancellationToken);

        if (!campaignExists)
        {
            return Result.Failure<List<CampaignCreativeDto>>("Campaign not found.");
        }

        var creatives = await _platformDbContext.CampaignCreatives
            .AsNoTracking()
            .Where(x => x.CampaignId == query.CampaignId && x.IsActive)
            .OrderBy(x => x.Type == CreativeType.StorySlide ? x.Sequence : 0)
            .ThenBy(x => x.Placement)
            .ThenBy(x => x.CreatedAt)
            .Select(x => new CampaignCreativeDto
            {
                Id = x.Id,
                CampaignId = x.CampaignId,
                Type = x.Type,
                Placement = x.Placement,
                SizeCode = x.SizeCode,
                Sequence = x.Sequence,
                MediaUrl = x.MediaUrl,
                Caption = x.Caption,
                CTAType = x.CTAType,
                CTAValue = x.CTAValue,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Result.Success(creatives);
    }
}
