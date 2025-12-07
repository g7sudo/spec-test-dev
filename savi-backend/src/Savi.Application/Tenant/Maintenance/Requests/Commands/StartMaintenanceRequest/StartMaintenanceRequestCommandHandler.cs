using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.StartMaintenanceRequest;

/// <summary>
/// Handler for starting work on a maintenance request.
/// </summary>
public class StartMaintenanceRequestCommandHandler
    : IRequestHandler<StartMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public StartMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        StartMaintenanceRequestCommand request,
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

        if (maintenanceRequest.Status != MaintenanceStatus.Assigned)
        {
            return Result.Failure("Can only start work on an assigned request.");
        }

        maintenanceRequest.StartWork(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
