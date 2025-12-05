using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Commands.CancelResidentInvite;

/// <summary>
/// Command to cancel a pending resident invite.
/// </summary>
public record CancelResidentInviteCommand(Guid InviteId) : IRequest<Result<bool>>;
