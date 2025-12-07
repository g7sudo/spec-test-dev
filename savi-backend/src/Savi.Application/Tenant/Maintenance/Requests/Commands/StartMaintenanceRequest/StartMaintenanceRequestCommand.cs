using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.StartMaintenanceRequest;

/// <summary>
/// Command to start work on a maintenance request.
/// </summary>
public record StartMaintenanceRequestCommand(Guid RequestId) : IRequest<Result>;
