using MediatR;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Commands.ResendResidentInvite;

/// <summary>
/// Command to resend a resident invite (cancels old one, creates new).
/// </summary>
public record ResendResidentInviteCommand(
    Guid InviteId,
    int ExpirationDays = 7
) : IRequest<Result<CreateResidentInviteResult>>;
