using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.RateMaintenanceRequest;

/// <summary>
/// Command to submit a rating for a completed maintenance request.
/// </summary>
public record RateMaintenanceRequestCommand(
    Guid RequestId,
    int Rating,
    string? Feedback
) : IRequest<Result>;
