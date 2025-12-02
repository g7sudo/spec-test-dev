using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;

namespace Savi.Application.Tenant.Community.Queries.GetBlockById;
/// <summary>
/// Handler for getting a block by ID.
/// </summary>
public class GetBlockByIdQueryHandler : IRequestHandler<GetBlockByIdQuery, Result<BlockDto>>
{
    private readonly ITenantDbContext _dbContext;
    public GetBlockByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<BlockDto>> Handle(GetBlockByIdQuery request, CancellationToken cancellationToken)
    {
        var block = await _dbContext.Blocks
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new BlockDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (block == null)
        {
            throw new NotFoundException("Block", request.Id);
        }
        return Result<BlockDto>.Success(block);
    }
}
