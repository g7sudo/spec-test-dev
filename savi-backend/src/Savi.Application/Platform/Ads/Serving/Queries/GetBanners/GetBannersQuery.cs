using MediatR;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.Domain.Platform.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Queries.GetBanners;

/// <summary>
/// Query to get banner ads for a tenant and screen.
/// </summary>
public sealed record GetBannersQuery(
    Guid TenantId,
    string Screen,
    List<AdPlacement> Placements
) : IRequest<Result<GetBannersResponse>>;
