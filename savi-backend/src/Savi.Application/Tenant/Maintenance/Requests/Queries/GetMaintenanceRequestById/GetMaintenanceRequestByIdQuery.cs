using MediatR;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Queries.GetMaintenanceRequestById;

/// <summary>
/// Query to get a maintenance request by ID.
/// </summary>
public record GetMaintenanceRequestByIdQuery(Guid Id) : IRequest<Result<MaintenanceRequestDto>>;
