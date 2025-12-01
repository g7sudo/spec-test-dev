using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants;

/// <summary>
/// Command to invite a community admin for a tenant.
/// </summary>
public sealed record InviteTenantAdminCommand : IRequest<Result<InviteTenantAdminResponse>>
{
    public Guid TenantId { get; init; }
    public InviteTenantAdminRequest Request { get; init; } = new();
}

/// <summary>
/// Query to validate an invitation token (public, anonymous).
/// </summary>
public sealed record ValidateInvitationQuery(string Token) : IRequest<Result<ValidateInvitationResponse>>;

/// <summary>
/// Command to accept an invitation (requires Firebase auth).
/// </summary>
public sealed record AcceptInvitationCommand : IRequest<Result<AcceptInvitationResponse>>
{
    public AcceptInvitationRequest Request { get; init; } = new();
}

