using MediatR;
using Savi.Application.Platform.ResidentInvites.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.ResidentInvites.Queries.ValidateInviteCode;

/// <summary>
/// Query to validate a resident invite access code (public, anonymous).
/// This is a platform-level query that doesn't require tenant context.
/// </summary>
public sealed record ValidateInviteCodeQuery(string AccessCode) : IRequest<Result<ValidateInviteCodeResponse>>;
