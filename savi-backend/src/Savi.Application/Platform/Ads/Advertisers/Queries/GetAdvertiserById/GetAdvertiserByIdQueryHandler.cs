using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Queries.GetAdvertiserById;

/// <summary>
/// Handler for GetAdvertiserByIdQuery.
/// </summary>
public sealed class GetAdvertiserByIdQueryHandler : IRequestHandler<GetAdvertiserByIdQuery, Result<AdvertiserDto>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public GetAdvertiserByIdQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<AdvertiserDto>> Handle(GetAdvertiserByIdQuery query, CancellationToken cancellationToken)
    {
        var advertiser = await _platformDbContext.Advertisers
            .AsNoTracking()
            .Where(x => x.Id == query.AdvertiserId && x.IsActive)
            .Select(x => new AdvertiserDto
            {
                Id = x.Id,
                Name = x.Name,
                ContactName = x.ContactName,
                ContactEmail = x.ContactEmail,
                ContactPhone = x.ContactPhone,
                Notes = x.Notes,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                CampaignCount = x.Campaigns.Count(c => c.IsActive)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (advertiser == null)
        {
            return Result.Failure<AdvertiserDto>("Advertiser not found.");
        }

        return Result.Success(advertiser);
    }
}
