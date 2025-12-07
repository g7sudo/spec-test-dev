using MediatR;
using Savi.Application.Tenant.Maintenance.RequestDetails.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Queries.ListMaintenanceRequestDetails;

/// <summary>
/// Query to list all detail lines for a maintenance request.
/// </summary>
public record ListMaintenanceRequestDetailsQuery(Guid MaintenanceRequestId) : IRequest<Result<List<MaintenanceRequestDetailDto>>>;
