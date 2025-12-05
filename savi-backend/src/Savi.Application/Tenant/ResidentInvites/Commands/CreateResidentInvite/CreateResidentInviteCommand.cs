using MediatR;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Commands.CreateResidentInvite;

/// <summary>
/// Command to create and send a resident invite.
/// </summary>
public record CreateResidentInviteCommand(
    Guid LeaseId,
    Guid PartyId,
    LeasePartyRole Role,
    string Email,
    int ExpirationDays = 7
) : IRequest<Result<CreateResidentInviteResult>>;
