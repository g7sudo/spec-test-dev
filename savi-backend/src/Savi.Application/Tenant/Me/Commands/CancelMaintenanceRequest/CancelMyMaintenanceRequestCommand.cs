using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Commands.CancelMaintenanceRequest;

/// <summary>
/// Command to cancel the current user's own maintenance request.
/// </summary>
public record CancelMyMaintenanceRequestCommand(
    Guid RequestId,
    string Reason
) : IRequest<Result>;
