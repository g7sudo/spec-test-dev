using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.AssignMaintenanceRequest;

/// <summary>
/// Command to assign a maintenance request to a technician.
/// </summary>
public record AssignMaintenanceRequestCommand(
    Guid RequestId,
    Guid AssignedToUserId
) : IRequest<Result>;
