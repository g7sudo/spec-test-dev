using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListParkingSlots;
/// <summary>
/// Handler for listing parking slots with pagination and optional filtering.
/// </summary>
public class ListParkingSlotsQueryHandler : IRequestHandler<ListParkingSlotsQuery, Result<PagedResult<ParkingSlotDto>>>
{
    private readonly ITenantDbContext _dbContext;
    public ListParkingSlotsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<PagedResult<ParkingSlotDto>>> Handle(ListParkingSlotsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.ParkingSlots
            .AsNoTracking()
            .Where(x => x.IsActive);
        // Apply filters
        if (request.AllocatedUnitId.HasValue)
        {
            query = query.Where(x => x.AllocatedUnitId == request.AllocatedUnitId.Value);
        }
        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.Code)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new ParkingSlotDto
            {
                Id = x.Id,
                Code = x.Code,
                LocationType = x.LocationType.ToString(),
                LevelLabel = x.LevelLabel,
                IsCovered = x.IsCovered,
                IsEVCompatible = x.IsEVCompatible,
                Status = x.Status.ToString(),
                Notes = x.Notes,
                AllocatedUnitId = x.AllocatedUnitId,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
        // Get unit numbers for allocated slots
        var allocatedUnitIds = items
            .Where(x => x.AllocatedUnitId.HasValue)
            .Select(x => x.AllocatedUnitId!.Value)
            .Distinct()
            .ToList();
        if (allocatedUnitIds.Any())
        {
            var unitNumbers = await _dbContext.Units
                .AsNoTracking()
                .Where(u => allocatedUnitIds.Contains(u.Id))
                .Select(u => new { u.Id, u.UnitNumber })
                .ToDictionaryAsync(u => u.Id, u => u.UnitNumber, cancellationToken);

            items = items.Select(x => x.AllocatedUnitId.HasValue && unitNumbers.ContainsKey(x.AllocatedUnitId.Value)
                ? x with { AllocatedUnitNumber = unitNumbers[x.AllocatedUnitId.Value] }
                : x).ToList();
        }
        var pagedResult = PagedResult<ParkingSlotDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount
        );
        return Result<PagedResult<ParkingSlotDto>>.Success(pagedResult);
    }
}
