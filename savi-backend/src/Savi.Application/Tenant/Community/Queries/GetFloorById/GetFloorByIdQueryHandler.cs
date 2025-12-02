using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;

namespace Savi.Application.Tenant.Community.Queries.GetFloorById;
/// <summary>
/// Handler for getting a floor by ID.
/// </summary>
public class GetFloorByIdQueryHandler : IRequestHandler<GetFloorByIdQuery, Result<FloorDto>>
{
    private readonly ITenantDbContext _dbContext;
    public GetFloorByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<FloorDto>> Handle(GetFloorByIdQuery request, CancellationToken cancellationToken)
    {
        var floor = await _dbContext.Floors
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new
            {
                Floor = x,
                BlockName = _dbContext.Blocks
                    .Where(b => b.Id == x.BlockId)
                    .Select(b => b.Name)
                    .FirstOrDefault() ?? string.Empty
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (floor == null)
        {
            throw new NotFoundException("Floor", request.Id);
        }
        var floorDto = new FloorDto
        {
            Id = floor.Floor.Id,
            BlockId = floor.Floor.BlockId,
            BlockName = floor.BlockName,
            Name = floor.Floor.Name,
            LevelNumber = floor.Floor.LevelNumber,
            DisplayOrder = floor.Floor.DisplayOrder,
            IsActive = floor.Floor.IsActive,
            CreatedAt = floor.Floor.CreatedAt
        };
        return Result<FloorDto>.Success(floorDto);
    }
}
