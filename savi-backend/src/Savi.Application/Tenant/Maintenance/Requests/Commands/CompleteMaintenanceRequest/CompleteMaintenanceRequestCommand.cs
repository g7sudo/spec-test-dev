using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CompleteMaintenanceRequest;

/// <summary>
/// Command to complete a maintenance request.
/// </summary>
public record CompleteMaintenanceRequestCommand(Guid RequestId) : IRequest<Result>;
