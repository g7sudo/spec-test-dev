using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Queries.ListAdvertisers;

/// <summary>
/// Handler for ListAdvertisersQuery.
/// </summary>
public sealed class ListAdvertisersQueryHandler : IRequestHandler<ListAdvertisersQuery, Result<PagedResult<AdvertiserDto>>>
{
    private readonly IPlatformDbContext _platformDbContext;

    public ListAdvertisersQueryHandler(IPlatformDbContext platformDbContext)
    {
        _platformDbContext = platformDbContext;
    }

    public async Task<Result<PagedResult<AdvertiserDto>>> Handle(ListAdvertisersQuery query, CancellationToken cancellationToken)
    {
        var baseQuery = _platformDbContext.Advertisers
            .AsNoTracking()
            .Where(x => x.IsActive);

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Name.ToLower().Contains(searchTerm) ||
                (x.ContactName != null && x.ContactName.ToLower().Contains(searchTerm)) ||
                (x.ContactEmail != null && x.ContactEmail.ToLower().Contains(searchTerm)));
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderBy(x => x.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
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
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<AdvertiserDto>(
            items,
            totalCount,
            query.Page,
            query.PageSize);

        return Result.Success(pagedResult);
    }
}
