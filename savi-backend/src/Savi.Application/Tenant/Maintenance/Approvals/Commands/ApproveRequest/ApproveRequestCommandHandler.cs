using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.ApproveRequest;

/// <summary>
/// Handler for approving a maintenance approval request.
/// </summary>
public class ApproveRequestCommandHandler
    : IRequestHandler<ApproveRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public ApproveRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        ApproveRequestCommand request,
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

        if (approval.Status != MaintenanceApprovalStatus.Pending)
        {
            return Result.Failure("Can only approve a pending approval request.");
        }

        approval.Approve(_currentUser.TenantUserId.Value, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
