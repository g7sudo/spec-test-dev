using MediatR;
using Savi.Application.Platform.Profile.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Profile.Queries.GetMyPlatformProfile;

/// <summary>
/// Query to get the current user's platform profile and tenant memberships.
/// </summary>
public sealed record GetMyPlatformProfileQuery : IRequest<Result<MyPlatformProfileDto>>;

