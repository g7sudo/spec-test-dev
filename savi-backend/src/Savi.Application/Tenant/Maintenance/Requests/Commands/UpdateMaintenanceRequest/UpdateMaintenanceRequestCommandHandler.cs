using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.UpdateMaintenanceRequest;

/// <summary>
/// Handler for updating an existing maintenance request.
/// </summary>
public class UpdateMaintenanceRequestCommandHandler
    : IRequestHandler<UpdateMaintenanceRequestCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateMaintenanceRequestCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(
        UpdateMaintenanceRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find the maintenance request
        var maintenanceRequest = await _dbContext.MaintenanceRequests
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.IsActive, cancellationToken);

        if (maintenanceRequest == null)
        {
            return Result.Failure($"Maintenance request with ID '{request.Id}' not found.");
        }

        // Validate category exists
        var categoryExists = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .AnyAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (!categoryExists)
        {
            return Result.Failure($"Category with ID '{request.CategoryId}' not found.");
        }

        // Update the request
        maintenanceRequest.UpdateContent(
            request.Title,
            request.Description,
            request.CategoryId,
            request.Priority,
            _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
