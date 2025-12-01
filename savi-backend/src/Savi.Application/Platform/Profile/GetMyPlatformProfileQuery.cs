using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Profile;

/// <summary>
/// Query to get the current user's platform profile and tenant memberships.
/// </summary>
public sealed record GetMyPlatformProfileQuery : IRequest<Result<MyPlatformProfileDto>>;

