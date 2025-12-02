using MediatR;
using Savi.Application.Platform.Tenants.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Commands.CreateTenant;

/// <summary>
/// Command to create a new tenant (community).
/// Requires PLATFORM_TENANT_MANAGE permission.
/// </summary>
public sealed record CreateTenantCommand : IRequest<Result<CreateTenantResponse>>
{
    /// <summary>
    /// The request data for creating the tenant.
    /// </summary>
    public CreateTenantRequest Request { get; init; } = new();
}
