using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.RejectMaintenanceRequest;

/// <summary>
/// Handler for rejecting a maintenance request.
/// </summary>
public class RejectMaintenanceRequestCommandHandler
    : IRequestHandler<RejectMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RejectMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        RejectMaintenanceRequestCommand request,
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
            return Result.Failure("Rejection reason is required.");
        }

        maintenanceRequest.Reject(request.Reason, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
