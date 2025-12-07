using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.Categories.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Categories.Queries.GetMaintenanceCategoryById;

/// <summary>
/// Handler for GetMaintenanceCategoryByIdQuery.
/// </summary>
public class GetMaintenanceCategoryByIdQueryHandler
    : IRequestHandler<GetMaintenanceCategoryByIdQuery, Result<MaintenanceCategoryDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetMaintenanceCategoryByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<MaintenanceCategoryDto>> Handle(
        GetMaintenanceCategoryByIdQuery request,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.MaintenanceCategories
            .AsNoTracking()
            .Where(c => c.Id == request.Id && c.IsActive)
            .Select(c => new MaintenanceCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                IsDefault = c.IsDefault,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (category == null)
        {
            return Result<MaintenanceCategoryDto>.Failure($"Category with ID '{request.Id}' not found.");
        }

        return Result<MaintenanceCategoryDto>.Success(category);
    }
}
