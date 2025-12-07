using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.RejectMaintenanceRequest;

/// <summary>
/// Command to reject a maintenance request.
/// </summary>
public record RejectMaintenanceRequestCommand(
    Guid RequestId,
    string Reason
) : IRequest<Result>;
