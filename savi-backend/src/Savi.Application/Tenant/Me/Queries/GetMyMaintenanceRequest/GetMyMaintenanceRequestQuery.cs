using MediatR;
using Savi.Application.Tenant.Maintenance.Requests.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Me.Queries.GetMyMaintenanceRequest;

/// <summary>
/// Query to get a maintenance request by ID with ownership validation.
/// Only returns requests created by the current user.
/// </summary>
public record GetMyMaintenanceRequestQuery(Guid RequestId) : IRequest<Result<MaintenanceRequestDto>>;
