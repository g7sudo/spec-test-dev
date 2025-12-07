using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.RequestApproval;

/// <summary>
/// Command to request owner approval for a maintenance request.
/// </summary>
public record RequestApprovalCommand(
    Guid MaintenanceRequestId,
    decimal? RequestedAmount,
    string? Currency,
    bool RequiresOwnerPayment
) : IRequest<Result<Guid>>;
