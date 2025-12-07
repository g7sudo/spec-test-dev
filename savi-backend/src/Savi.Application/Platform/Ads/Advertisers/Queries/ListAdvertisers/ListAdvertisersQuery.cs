using MediatR;
using Savi.Application.Platform.Ads.Advertisers.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Advertisers.Queries.ListAdvertisers;

/// <summary>
/// Query to list advertisers with pagination.
/// </summary>
public sealed record ListAdvertisersQuery(
    int Page = 1,
    int PageSize = 20,
    string? SearchTerm = null
) : IRequest<Result<PagedResult<AdvertiserDto>>>;
