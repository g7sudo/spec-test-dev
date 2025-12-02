using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Community.Queries.ListBlocks;
/// <summary>
/// Handler for listing blocks with pagination.
/// </summary>
public class ListBlocksQueryHandler : IRequestHandler<ListBlocksQuery, Result<PagedResult<BlockDto>>>
{
    private readonly ITenantDbContext _dbContext;
    public ListBlocksQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<PagedResult<BlockDto>>> Handle(ListBlocksQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Blocks
            .AsNoTracking()
            .Where(x => x.IsActive);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new BlockDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
        var pagedResult = PagedResult<BlockDto>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount
        );
        return Result<PagedResult<BlockDto>>.Success(pagedResult);
    }
}
