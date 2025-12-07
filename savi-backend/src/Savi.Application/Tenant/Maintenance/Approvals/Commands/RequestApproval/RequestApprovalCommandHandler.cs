using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Approvals.Commands.RequestApproval;

/// <summary>
/// Handler for requesting owner approval.
/// </summary>
public class RequestApprovalCommandHandler
    : IRequestHandler<RequestApprovalCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RequestApprovalCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        RequestApprovalCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate maintenance request exists
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result<Guid>.Failure($"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        // Check if there's already a pending approval
        var existingPendingApproval = await _dbContext.MaintenanceApprovals
            .AsNoTracking()
            .AnyAsync(a => a.MaintenanceRequestId == request.MaintenanceRequestId &&
                          a.Status == MaintenanceApprovalStatus.Pending &&
                          a.IsActive, cancellationToken);

        if (existingPendingApproval)
        {
            return Result<Guid>.Failure("There is already a pending approval for this request.");
        }

        // Create the approval request
        var approval = MaintenanceApproval.Create(
            request.MaintenanceRequestId,
            request.RequestedAmount,
            request.Currency,
            _currentUser.TenantUserId.Value,
            request.RequiresOwnerPayment,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(approval);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(approval.Id);
    }
}
