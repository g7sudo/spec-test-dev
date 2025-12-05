using MediatR;
using Savi.Application.Tenant.ResidentInvites.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.ResidentInvites.Queries.ValidateResidentInvite;

/// <summary>
/// Query to validate a resident invite by ID and token.
/// This is a public endpoint (no auth required).
/// </summary>
public record ValidateResidentInviteQuery(
    Guid InviteId,
    string Token
) : IRequest<Result<ResidentInviteValidationDto>>;
