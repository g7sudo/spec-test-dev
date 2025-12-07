using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Maintenance.RequestDetails.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.RequestDetails.Queries.ListMaintenanceRequestDetails;

/// <summary>
/// Handler for ListMaintenanceRequestDetailsQuery.
/// </summary>
public class ListMaintenanceRequestDetailsQueryHandler
    : IRequestHandler<ListMaintenanceRequestDetailsQuery, Result<List<MaintenanceRequestDetailDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListMaintenanceRequestDetailsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<MaintenanceRequestDetailDto>>> Handle(
        ListMaintenanceRequestDetailsQuery request,
        CancellationToken cancellationToken)
    {
        // Validate maintenance request exists
        var requestExists = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(r => r.Id == request.MaintenanceRequestId && r.IsActive, cancellationToken);

        if (!requestExists)
        {
            return Result<List<MaintenanceRequestDetailDto>>.Failure(
                $"Maintenance request with ID '{request.MaintenanceRequestId}' not found.");
        }

        var details = await _dbContext.MaintenanceRequestDetails
            .AsNoTracking()
            .Where(d => d.MaintenanceRequestId == request.MaintenanceRequestId && d.IsActive)
            .OrderBy(d => d.SortOrder)
            .ThenBy(d => d.CreatedAt)
            .Select(d => new MaintenanceRequestDetailDto
            {
                Id = d.Id,
                MaintenanceRequestId = d.MaintenanceRequestId,
                LineType = d.LineType,
                Description = d.Description,
                Quantity = d.Quantity,
                UnitOfMeasure = d.UnitOfMeasure,
                EstimatedUnitPrice = d.EstimatedUnitPrice,
                EstimatedTotalPrice = d.EstimatedTotalPrice,
                IsBillable = d.IsBillable,
                SortOrder = d.SortOrder,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Result<List<MaintenanceRequestDetailDto>>.Success(details);
    }
}
