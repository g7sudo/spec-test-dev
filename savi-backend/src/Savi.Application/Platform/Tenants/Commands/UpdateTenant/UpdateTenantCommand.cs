using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Commands.UpdateTenant;

/// <summary>
/// Command to update an existing tenant.
/// </summary>
public sealed record UpdateTenantCommand : IRequest<Result<UpdateTenantResponse>>
{
    public Guid TenantId { get; init; }
    public UpdateTenantRequest Request { get; init; } = new();
}
