using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.UpdateMaintenanceRequestDetail;

/// <summary>
/// Handler for updating a maintenance request detail line.
/// </summary>
public class UpdateMaintenanceRequestDetailCommandHandler
    : IRequestHandler<UpdateMaintenanceRequestDetailCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateMaintenanceRequestDetailCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        UpdateMaintenanceRequestDetailCommand request,
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

        detail.Update(
            request.LineType,
            request.Description,
            request.Quantity,
            request.UnitOfMeasure,
            request.EstimatedUnitPrice,
            request.IsBillable,
            request.SortOrder,
            _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
