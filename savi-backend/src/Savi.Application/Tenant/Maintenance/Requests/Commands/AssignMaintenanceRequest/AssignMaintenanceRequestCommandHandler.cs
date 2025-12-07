using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.AssignMaintenanceRequest;

/// <summary>
/// Handler for assigning a maintenance request to a technician.
/// </summary>
public class AssignMaintenanceRequestCommandHandler
    : IRequestHandler<AssignMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AssignMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        AssignMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find the maintenance request
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .FirstOrDefaultAsync(r => r.Id == request.RequestId && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result.Failure($"Maintenance request with ID '{request.RequestId}' not found.");
        }

        // Validate assignee exists
        var assigneeExists = await _dbContext.CommunityUsers
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.AssignedToUserId && u.IsActive, cancellationToken);

        if (!assigneeExists)
        {
            return Result.Failure($"User with ID '{request.AssignedToUserId}' not found.");
        }

        // Assign the request
        maintenanceRequest.Assign(request.AssignedToUserId, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
