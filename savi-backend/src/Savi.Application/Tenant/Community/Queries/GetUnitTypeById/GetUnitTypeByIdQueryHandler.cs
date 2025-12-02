using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;

namespace Savi.Application.Tenant.Community.Queries.GetUnitTypeById;
public class GetUnitTypeByIdQueryHandler : IRequestHandler<GetUnitTypeByIdQuery, Result<UnitTypeDto>>
{
    private readonly ITenantDbContext _dbContext;
    public GetUnitTypeByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<UnitTypeDto>> Handle(GetUnitTypeByIdQuery request, CancellationToken cancellationToken)
    {
        var unitType = await _dbContext.UnitTypes
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
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
            .FirstOrDefaultAsync(cancellationToken);
        if (unitType == null)
        {
            throw new NotFoundException("UnitType", request.Id);
        }
        return Result<UnitTypeDto>.Success(unitType);
    }
}
