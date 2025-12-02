using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Platform.Tenants.Commands.ArchiveTenant;

/// <summary>
/// Command to archive (soft-delete) a tenant.
/// </summary>
public sealed record ArchiveTenantCommand(Guid TenantId) : IRequest<Result<Unit>>;
