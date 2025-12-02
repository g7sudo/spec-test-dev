using MediatR;
using Savi.Application.Platform.Profile.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Profile.Queries.GetMyPlatformProfile;

/// <summary>
/// Query to get the current user's auth context.
/// 
/// Returns user profile, tenant memberships (for dropdown),
/// current scope, and context-aware permissions.
/// </summary>
public sealed record GetMyPlatformProfileQuery : IRequest<Result<AuthMeResponseDto>>;
