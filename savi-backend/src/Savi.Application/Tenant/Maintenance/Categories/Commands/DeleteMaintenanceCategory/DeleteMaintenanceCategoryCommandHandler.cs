using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.DeleteMaintenanceCategory;

/// <summary>
/// Handler for deleting (soft-delete) a maintenance category.
/// </summary>
public class DeleteMaintenanceCategoryCommandHandler
    : IRequestHandler<DeleteMaintenanceCategoryCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteMaintenanceCategoryCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        DeleteMaintenanceCategoryCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Find the category
        var category = await _dbContext.MaintenanceCategories
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.IsActive, cancellationToken);

        if (category == null)
        {
            return Result<bool>.Failure($"Category with ID '{request.Id}' not found.");
        }

        // Check if category is in use by any maintenance requests
        var inUse = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.CategoryId == request.Id && r.IsActive, cancellationToken);

        if (inUse)
        {
            return Result<bool>.Failure(
                "Cannot delete this category because it is being used by existing maintenance requests.");
        }

        // Soft delete
        category.Deactivate(_currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
