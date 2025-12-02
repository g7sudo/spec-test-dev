using MediatR;
using Savi.Application.Tenant.Me.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyProfile;

/// <summary>
/// Query to get the current user's community profile.
/// Creates a default profile if one doesn't exist.
/// </summary>
public record GetMyProfileQuery : IRequest<Result<MyCommunityProfileDto>>;

