using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListUnits;
/// <summary>
/// Handler for listing units with pagination and optional filtering.
/// </summary>
public class ListUnitsQueryHandler : IRequestHandler<ListUnitsQuery, Result<PagedResult<UnitDto>>>
{
    private readonly ITenantDbContext _dbContext;
    public ListUnitsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<PagedResult<UnitDto>>> Handle(ListUnitsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Units
            .AsNoTracking()
            .Where(x => x.IsActive);
        // Apply filters
        if (request.BlockId.HasValue)
        {
            query = query.Where(x => x.BlockId == request.BlockId.Value);
        }
        if (request.FloorId.HasValue)
        {
            query = query.Where(x => x.FloorId == request.FloorId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Join with related entities to get names
        var items = await query
            .OrderBy(x => x.UnitNumber)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                Unit = x,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == x.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault() ?? string.Empty,
                FloorName = _dbContext.Floors
                    .Where(f => f.Id == x.FloorId)
                    .Select(f => f.Name)
                    .FirstOrDefault() ?? string.Empty,
                UnitTypeName = _dbContext.UnitTypes
                    .Where(ut => ut.Id == x.UnitTypeId)
                    .Select(ut => ut.Name)
                    .FirstOrDefault() ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        var unitDtos = items.Select(x => new UnitDto
        {
            Id = x.Unit.Id,
            BlockId = x.Unit.BlockId,
            BlockName = x.BlockName,
            FloorId = x.Unit.FloorId,
            FloorName = x.FloorName,
            UnitTypeId = x.Unit.UnitTypeId,
            UnitTypeName = x.UnitTypeName,
            UnitNumber = x.Unit.UnitNumber,
            AreaSqft = x.Unit.AreaSqft,
            Status = x.Unit.Status.ToString(),
            Notes = x.Unit.Notes,
            IsActive = x.Unit.IsActive,
            CreatedAt = x.Unit.CreatedAt
        }).ToList();

        var pagedResult = PagedResult<UnitDto>.Create(
            unitDtos,
            request.Page,
            request.PageSize,
            totalCount
        );

        return Result<PagedResult<UnitDto>>.Success(pagedResult);
    }
}
