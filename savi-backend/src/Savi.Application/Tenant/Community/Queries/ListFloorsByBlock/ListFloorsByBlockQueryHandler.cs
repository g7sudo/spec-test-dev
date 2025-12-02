using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;

namespace Savi.Application.Tenant.Community.Queries.ListFloorsByBlock;
/// <summary>
/// Handler for listing floors by block with pagination.
/// </summary>
public class ListFloorsByBlockQueryHandler : IRequestHandler<ListFloorsByBlockQuery, Result<PagedResult<FloorDto>>>
{
    private readonly ITenantDbContext _dbContext;
    public ListFloorsByBlockQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<PagedResult<FloorDto>>> Handle(ListFloorsByBlockQuery request, CancellationToken cancellationToken)
    {
        // Get block name for the DTOs
        var blockName = await _dbContext.Blocks
            .AsNoTracking()
            .Where(b => b.Id == request.BlockId && b.IsActive)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken);
        if (blockName == null)
        {
            return Result<PagedResult<FloorDto>>.Failure($"Block with ID '{request.BlockId}' not found.");
        }
        var query = _dbContext.Floors
            .Where(x => x.BlockId == request.BlockId && x.IsActive);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.LevelNumber)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new FloorDto
            {
                Id = x.Id,
                BlockId = x.BlockId,
                BlockName = blockName,
                Name = x.Name,
                LevelNumber = x.LevelNumber,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
        var pagedResult = PagedResult<FloorDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount
        );
        return Result<PagedResult<FloorDto>>.Success(pagedResult);
    }
}
