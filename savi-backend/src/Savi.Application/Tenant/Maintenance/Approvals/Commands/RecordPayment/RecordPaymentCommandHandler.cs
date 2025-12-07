using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.RecordPayment;

/// <summary>
/// Handler for recording owner payment.
/// </summary>
public class RecordPaymentCommandHandler
    : IRequestHandler<RecordPaymentCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RecordPaymentCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        RecordPaymentCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var approval = await _dbContext.MaintenanceApprovals
            .FirstOrDefaultAsync(a => a.Id == request.ApprovalId && a.IsActive, cancellationToken);

        if (approval == null)
        {
            return Result.Failure($"Approval with ID '{request.ApprovalId}' not found.");
        }

        if (approval.Status != MaintenanceApprovalStatus.Approved)
        {
            return Result.Failure("Can only record payment for approved requests.");
        }

        if (request.PaidAmount <= 0)
        {
            return Result.Failure("Paid amount must be positive.");
        }

        approval.RecordPayment(request.PaidAmount, request.PaymentReference, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
