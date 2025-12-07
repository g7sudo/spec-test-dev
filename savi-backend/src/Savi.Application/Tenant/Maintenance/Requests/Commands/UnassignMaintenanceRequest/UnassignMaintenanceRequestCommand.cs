using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.UnassignMaintenanceRequest;

/// <summary>
/// Command to unassign a maintenance request from its current technician.
/// </summary>
public record UnassignMaintenanceRequestCommand(Guid RequestId) : IRequest<Result>;
