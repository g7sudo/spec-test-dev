using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.CreateBlock;
/// <summary>
/// Handler for creating a new block.
/// </summary>
public class CreateBlockCommandHandler : IRequestHandler<CreateBlockCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public CreateBlockCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(CreateBlockCommand request, CancellationToken cancellationToken)
    {
        // Check if a block with the same name already exists (case-insensitive)
        var nameExists = await _dbContext.Blocks
            .AsNoTracking()
            .AnyAsync(x => x.Name.ToLower() == request.Name.ToLower() && x.IsActive, cancellationToken);
        if (nameExists)
        {
            return Result<Guid>.Failure($"A block with the name '{request.Name}' already exists.");
        }
        // Create the block using domain factory method
        var block = Block.Create(
            request.Name,
            request.Description,
            request.DisplayOrder,
            _currentUser.UserId
        );
        _dbContext.Add(block);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(block.Id);
    }
}
