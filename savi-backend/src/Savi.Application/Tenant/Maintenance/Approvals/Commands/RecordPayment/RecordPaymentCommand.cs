using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.RecordPayment;

/// <summary>
/// Command to record owner payment for an approved request.
/// </summary>
public record RecordPaymentCommand(
    Guid ApprovalId,
    decimal PaidAmount,
    string? PaymentReference
) : IRequest<Result>;
