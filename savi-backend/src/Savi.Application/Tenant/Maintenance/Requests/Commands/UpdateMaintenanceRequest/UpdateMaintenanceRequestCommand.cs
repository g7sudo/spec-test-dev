using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.UpdateMaintenanceRequest;

/// <summary>
/// Command to update an existing maintenance request.
/// </summary>
public record UpdateMaintenanceRequestCommand(
    Guid Id,
    string Title,
    string? Description,
    Guid CategoryId,
    MaintenancePriority Priority
) : IRequest<Result>;
