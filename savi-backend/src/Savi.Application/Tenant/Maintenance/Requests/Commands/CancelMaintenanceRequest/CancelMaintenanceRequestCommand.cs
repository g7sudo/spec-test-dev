using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CancelMaintenanceRequest;

/// <summary>
/// Command to cancel a maintenance request.
/// </summary>
public record CancelMaintenanceRequestCommand(
    Guid RequestId,
    string Reason
) : IRequest<Result>;
