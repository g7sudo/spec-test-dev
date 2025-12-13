using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Me.Commands.CancelMaintenanceRequest;

/// <summary>
/// Handler for cancelling the current user's own maintenance request.
/// Validates that the user owns the request before allowing cancellation.
/// </summary>
public class CancelMyMaintenanceRequestCommandHandler
    : IRequestHandler<CancelMyMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CancelMyMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        CancelMyMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result.Failure($"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Ownership validation: Only allow cancellation if user created the request
        if (maintenanceRequest.RequestedByUserId != _currentUser.TenantUserId.Value)
        {
            return Result.Failure("You can only cancel maintenance requests that you created.");
        }

        // Only allow cancellation for new/assigned requests
        if (maintenanceRequest.Status != MaintenanceStatus.New &&
            maintenanceRequest.Status != MaintenanceStatus.Assigned)
        {
            return Result.Failure(
                $"Cannot cancel a request with status '{maintenanceRequest.Status}'. " +
                "Only New or Assigned requests can be cancelled.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return Result.Failure("Cancellation reason is required.");
        }

        maintenanceRequest.Cancel(
            request.Reason,
            _currentUser.TenantUserId.Value,
            _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
