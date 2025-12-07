using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CreateMaintenanceRequest;

/// <summary>
/// Command to create a new maintenance request.
/// </summary>
public record CreateMaintenanceRequestCommand(
    Guid UnitId,
    Guid CategoryId,
    Guid RequestedForPartyId,
    string Title,
    string? Description,
    MaintenancePriority Priority = MaintenancePriority.Normal,
    MaintenanceSource Source = MaintenanceSource.AdminPortal,
    DateTime? DueBy = null
) : IRequest<Result<Guid>>;
