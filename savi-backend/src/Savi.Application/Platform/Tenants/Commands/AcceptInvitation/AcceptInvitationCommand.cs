using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Commands.AcceptInvitation;

/// <summary>
/// Command to accept an invitation (requires Firebase auth).
/// </summary>
public sealed record AcceptInvitationCommand : IRequest<Result<AcceptInvitationResponse>>
{
    public AcceptInvitationRequest Request { get; init; } = new();
}
