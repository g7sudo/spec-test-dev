using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Commands.AddMaintenanceRequestDetail;

/// <summary>
/// Handler for adding a detail line to a maintenance request.
/// </summary>
public class AddMaintenanceRequestDetailCommandHandler
    : IRequestHandler<AddMaintenanceRequestDetailCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public AddMaintenanceRequestDetailCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        AddMaintenanceRequestDetailCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Validate maintenance request exists
        var requestExists = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (!requestExists)
        {
            return Result<Guid>.Failure($"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        // Create the detail line
        var detail = MaintenanceRequestDetail.Create(
            request.MaintenanceRequestId,
            request.LineType,
            request.Description,
            request.Quantity,
            request.UnitOfMeasure,
            request.EstimatedUnitPrice,
            request.IsBillable,
            request.SortOrder,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(detail);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(detail.Id);
    }
}
