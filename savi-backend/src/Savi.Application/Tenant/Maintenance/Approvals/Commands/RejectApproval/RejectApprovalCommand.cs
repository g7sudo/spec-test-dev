using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.RejectApproval;

/// <summary>
/// Command to reject a maintenance approval request.
/// </summary>
public record RejectApprovalCommand(
    Guid ApprovalId,
    string Reason
) : IRequest<Result>;
