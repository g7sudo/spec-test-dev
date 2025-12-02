using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.UpdateBlock;
/// <summary>
/// Handler for updating an existing block.
/// </summary>
public class UpdateBlockCommandHandler : IRequestHandler<UpdateBlockCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public UpdateBlockCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(UpdateBlockCommand request, CancellationToken cancellationToken)
    {
        // Find the block
        var block = await _dbContext.Blocks
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (block == null)
        {
            throw new NotFoundException("Block", request.Id);
        }
        // Check if another block with the same name exists (excluding current block)
        var nameExists = await _dbContext.Blocks
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id 
                && x.Name.ToLower() == request.Name.ToLower() 
                && x.IsActive, cancellationToken);
        if (nameExists)
            return Result.Failure($"A block with the name '{request.Name}' already exists.");
        // Update the block using domain method
        block.Update(
            request.Name,
            request.Description,
            request.DisplayOrder,
            _currentUser.UserId
        );
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
