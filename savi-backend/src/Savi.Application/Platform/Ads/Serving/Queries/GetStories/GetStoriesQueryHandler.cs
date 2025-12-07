using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Queries.GetStories;

/// <summary>
/// Handler for GetStoriesQuery.
/// </summary>
public sealed class GetStoriesQueryHandler : IRequestHandler<GetStoriesQuery, Result<GetStoriesResponse>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetStoriesQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<GetStoriesResponse>> Handle(GetStoriesQuery query, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Get active story campaigns for this tenant
        var storyCampaigns = await _platformDbContext.CampaignTargetTenants
            .AsNoTracking()
            .Where(t => t.TenantId == query.TenantId && t.IsActive)
            .Join(
                _platformDbContext.Campaigns
                    .Where(c => c.IsActive &&
                               c.Type == CampaignType.Story &&
                               c.Status == CampaignStatus.Active &&
                               c.StartsAt <= now &&
                               (c.EndsAt == null || c.EndsAt > now)),
                t => t.CampaignId,
                c => c.Id,
                (t, c) => c)
            .OrderByDescending(c => c.Priority)
            .Select(c => new
            {
                c.Id,
                c.Name
            })
            .ToListAsync(cancellationToken);

        var campaignDtos = new List<StoryCampaignDto>();

        foreach (var campaign in storyCampaigns)
        {
            var slides = await _platformDbContext.CampaignCreatives
                .AsNoTracking()
                .Where(cr => cr.CampaignId == campaign.Id &&
                            cr.IsActive &&
                            cr.Type == CreativeType.StorySlide)
                .OrderBy(cr => cr.Sequence)
                .Select(cr => new StorySlideDto
                {
                    CreativeId = cr.Id,
                    Sequence = cr.Sequence ?? 0,
                    ImageUrl = cr.MediaUrl,
                    Caption = cr.Caption,
                    CTAType = cr.CTAType,
                    CTAValue = cr.CTAValue
                })
                .ToListAsync(cancellationToken);

            if (slides.Any())
            {
                campaignDtos.Add(new StoryCampaignDto
                {
                    CampaignId = campaign.Id,
                    Name = campaign.Name,
                    Slides = slides
                });
            }
        }

        var response = new GetStoriesResponse
        {
            TenantId = query.TenantId,
            Campaigns = campaignDtos
        };

        return Result.Success(response);
    }
}
