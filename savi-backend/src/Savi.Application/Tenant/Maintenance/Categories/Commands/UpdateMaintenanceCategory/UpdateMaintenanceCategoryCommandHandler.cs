using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.UpdateMaintenanceCategory;

/// <summary>
/// Handler for updating an existing maintenance category.
/// </summary>
public class UpdateMaintenanceCategoryCommandHandler
    : IRequestHandler<UpdateMaintenanceCategoryCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateMaintenanceCategoryCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        UpdateMaintenanceCategoryCommand request,
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

        // Check for duplicate name (excluding current)
        var nameExists = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .AnyAsync(c => c.Id != request.Id &&
                          c.Name.ToLower() == request.Name.ToLower() &&
                          c.IsActive,
                cancellationToken);

        if (nameExists)
        {
            return Result<bool>.Failure($"Another category with the name '{request.Name}' already exists.");
        }

        // Check for duplicate code if provided (excluding current)
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _dbContext.MaintenanceCategories
                .AsNoTracking()
                .AnyAsync(c => c.Id != request.Id &&
                              c.Code != null &&
                              c.Code.ToLower() == request.Code.ToLower() &&
                              c.IsActive,
                    cancellationToken);

            if (codeExists)
            {
                return Result<bool>.Failure($"Another category with the code '{request.Code}' already exists.");
            }
        }

        // If this is marked as default, clear other defaults
        if (request.IsDefault && !category.IsDefault)
        {
            var currentDefaults = await _dbContext.MaintenanceCategories
                .Where(c => c.Id != request.Id && c.IsDefault && c.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var cat in currentDefaults)
            {
                cat.Update(
                    cat.Name,
                    cat.Code,
                    cat.Description,
                    cat.DisplayOrder,
                    false,
                    _currentUser.TenantUserId.Value);
            }
        }

        // Update the category
        category.Update(
            request.Name,
            request.Code,
            request.Description,
            request.DisplayOrder,
            request.IsDefault,
            _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
