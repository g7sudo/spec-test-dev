using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.ApproveRequest;

/// <summary>
/// Command to approve a maintenance approval request.
/// </summary>
public record ApproveRequestCommand(Guid ApprovalId) : IRequest<Result>;
