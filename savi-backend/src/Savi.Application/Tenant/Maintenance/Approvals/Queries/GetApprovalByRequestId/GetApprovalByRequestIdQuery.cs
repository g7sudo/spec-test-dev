using MediatR;
using Savi.Application.Tenant.Maintenance.Approvals.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Queries.GetApprovalByRequestId;

/// <summary>
/// Query to get the approval for a maintenance request.
/// </summary>
public record GetApprovalByRequestIdQuery(Guid MaintenanceRequestId) : IRequest<Result<MaintenanceApprovalDto?>>;
