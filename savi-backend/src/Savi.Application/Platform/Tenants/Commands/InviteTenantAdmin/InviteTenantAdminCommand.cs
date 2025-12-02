using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Commands.InviteTenantAdmin;

/// <summary>
/// Command to invite a community admin for a tenant.
/// </summary>
public sealed record InviteTenantAdminCommand : IRequest<Result<InviteTenantAdminResponse>>
{
    public Guid TenantId { get; init; }
    public InviteTenantAdminRequest Request { get; init; } = new();
}
