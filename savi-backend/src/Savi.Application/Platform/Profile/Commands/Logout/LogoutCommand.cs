using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Profile.Commands.Logout;

/// <summary>
/// Command to record a user logout for audit purposes.
/// 
/// Note: This does not invalidate tokens (Firebase handles that).
/// It records an audit entry for security tracking.
/// </summary>
public sealed record LogoutCommand : IRequest<Result>;

