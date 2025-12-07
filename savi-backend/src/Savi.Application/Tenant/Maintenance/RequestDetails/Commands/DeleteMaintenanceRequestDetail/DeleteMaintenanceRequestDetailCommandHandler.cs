using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.DeleteMaintenanceRequestDetail;

/// <summary>
/// Handler for deleting a maintenance request detail line.
/// </summary>
public class DeleteMaintenanceRequestDetailCommandHandler
    : IRequestHandler<DeleteMaintenanceRequestDetailCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteMaintenanceRequestDetailCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        DeleteMaintenanceRequestDetailCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        var detail = await _dbContext.MaintenanceRequestDetails
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.IsActive, cancellationToken);

        if (detail == null)
        {
            return Result.Failure($"Detail with ID '{request.Id}' not found.");
        }

        detail.Deactivate(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
