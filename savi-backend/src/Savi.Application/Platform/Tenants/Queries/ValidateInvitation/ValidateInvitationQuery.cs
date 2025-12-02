using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Queries.ValidateInvitation;

/// <summary>
/// Query to validate an invitation token (public, anonymous).
/// </summary>
public sealed record ValidateInvitationQuery(string Token) : IRequest<Result<ValidateInvitationResponse>>;
