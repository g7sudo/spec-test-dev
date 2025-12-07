using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.DeleteMaintenanceRequestDetail;

/// <summary>
/// Command to delete a maintenance request detail line.
/// </summary>
public record DeleteMaintenanceRequestDetailCommand(Guid Id) : IRequest<Result>;
