using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.CancelMaintenanceRequest;

/// <summary>
/// Handler for cancelling a maintenance request.
/// </summary>
public class CancelMaintenanceRequestCommandHandler
    : IRequestHandler<CancelMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CancelMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        CancelMaintenanceRequestCommand request,
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
