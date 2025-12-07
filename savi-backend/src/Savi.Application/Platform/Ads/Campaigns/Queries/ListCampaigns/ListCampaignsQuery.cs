using MediatR;
using Savi.Application.Platform.Ads.Campaigns.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Campaigns.Queries.ListCampaigns;

/// <summary>
/// Query to list campaigns with pagination and filters.
/// </summary>
public sealed record ListCampaignsQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? AdvertiserId = null,
    CampaignType? Type = null,
    CampaignStatus? Status = null,
    string? SearchTerm = null
) : IRequest<Result<PagedResult<CampaignDto>>>;
