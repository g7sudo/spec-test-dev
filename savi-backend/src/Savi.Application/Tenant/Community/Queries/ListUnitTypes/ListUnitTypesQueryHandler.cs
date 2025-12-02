using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListUnitTypes;
public class ListUnitTypesQueryHandler : IRequestHandler<ListUnitTypesQuery, Result<PagedResult<UnitTypeDto>>>
{
    private readonly ITenantDbContext _dbContext;
    public ListUnitTypesQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<PagedResult<UnitTypeDto>>> Handle(ListUnitTypesQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.UnitTypes
            .AsNoTracking()
            .Where(x => x.IsActive);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.Code)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new UnitTypeDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                DefaultParkingSlots = x.DefaultParkingSlots,
                DefaultOccupancyLimit = x.DefaultOccupancyLimit,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
        var pagedResult = new PagedResult<UnitTypeDto>(
            items,
            totalCount,
            request.Page,
            request.PageSize
        );
        return Result<PagedResult<UnitTypeDto>>.Success(pagedResult);
    }
}
