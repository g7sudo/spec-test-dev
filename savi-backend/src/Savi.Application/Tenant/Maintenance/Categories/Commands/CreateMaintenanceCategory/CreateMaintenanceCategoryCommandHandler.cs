using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Maintenance.Categories.Commands.CreateMaintenanceCategory;

/// <summary>
/// Handler for creating a new maintenance category.
/// </summary>
public class CreateMaintenanceCategoryCommandHandler
    : IRequestHandler<CreateMaintenanceCategoryCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateMaintenanceCategoryCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateMaintenanceCategoryCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Check for duplicate name
        var nameExists = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower() && c.IsActive,
                cancellationToken);

        if (nameExists)
        {
            return Result<Guid>.Failure($"A category with the name '{request.Name}' already exists.");
        }

        // Check for duplicate code if provided
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _dbContext.MaintenanceCategories
                .AsNoTracking()
                .AnyAsync(c => c.Code != null &&
                              c.Code.ToLower() == request.Code.ToLower() &&
                              c.IsActive,
                    cancellationToken);

            if (codeExists)
            {
                return Result<Guid>.Failure($"A category with the code '{request.Code}' already exists.");
            }
        }

        // If this is marked as default, clear other defaults
        if (request.IsDefault)
        {
            var currentDefaults = await _dbContext.MaintenanceCategories
                .Where(c => c.IsDefault && c.IsActive)
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

        // Create the category
        var category = MaintenanceCategory.Create(
            request.Name,
            request.Code,
            request.Description,
            request.DisplayOrder,
            request.IsDefault,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}
