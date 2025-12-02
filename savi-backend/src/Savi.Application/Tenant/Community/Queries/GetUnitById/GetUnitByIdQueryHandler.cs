using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;

namespace Savi.Application.Tenant.Community.Queries.GetUnitById;
/// <summary>
/// Handler for getting a unit by ID.
/// </summary>
public class GetUnitByIdQueryHandler : IRequestHandler<GetUnitByIdQuery, Result<UnitDto>>
{
    private readonly ITenantDbContext _dbContext;
    public GetUnitByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<UnitDto>> Handle(GetUnitByIdQuery request, CancellationToken cancellationToken)
    {
        var unit = await _dbContext.Units
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new UnitDto
            {
                Id = x.Id,
                BlockId = x.BlockId,
                FloorId = x.FloorId,
                UnitTypeId = x.UnitTypeId,
                UnitNumber = x.UnitNumber,
                AreaSqft = x.AreaSqft,
                Status = x.Status.ToString(),
                Notes = x.Notes,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (unit == null)
        {
            throw new NotFoundException("Unit", request.Id);
        }
        // Get related entity names
        var blockName = await _dbContext.Blocks
            .Where(b => b.Id == unit.BlockId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        var floorName = await _dbContext.Floors
            .AsNoTracking()
            .Where(f => f.Id == unit.FloorId)
            .Select(f => f.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var unitTypeName = await _dbContext.UnitTypes
            .AsNoTracking()
            .Where(ut => ut.Id == unit.UnitTypeId)
            .Select(ut => ut.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var unitDto = unit with
        {
            BlockName = blockName,
            FloorName = floorName,
            UnitTypeName = unitTypeName
        };

        return Result<UnitDto>.Success(unitDto);
    }
}
