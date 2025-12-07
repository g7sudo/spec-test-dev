using MediatR;
using Savi.Application.Platform.Ads.Serving.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Ads.Serving.Queries.GetStories;

/// <summary>
/// Query to get story campaigns for a tenant.
/// </summary>
public sealed record GetStoriesQuery(Guid TenantId) : IRequest<Result<GetStoriesResponse>>;
