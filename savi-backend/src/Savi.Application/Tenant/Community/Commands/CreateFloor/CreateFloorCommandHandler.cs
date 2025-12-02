using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.CreateFloor;
/// <summary>
/// Handler for creating a new floor.
/// </summary>
public class CreateFloorCommandHandler : IRequestHandler<CreateFloorCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public CreateFloorCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(CreateFloorCommand request, CancellationToken cancellationToken)
    {
        // Verify block exists
        var blockExists = await _dbContext.Blocks
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.BlockId && x.IsActive, cancellationToken);
        if (!blockExists)
        {
            return Result<Guid>.Failure($"Block with ID '{request.BlockId}' not found.");
        }
        // Check if a floor with the same name already exists in this block
        var nameExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.BlockId == request.BlockId 
                && x.Name.ToLower() == request.Name.ToLower() 
                && x.IsActive, cancellationToken);

        if (nameExists)
        {
            return Result<Guid>.Failure($"A floor with the name '{request.Name}' already exists in this block.");
        }

        // Check if a floor with the same level number already exists in this block
        var levelExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.BlockId == request.BlockId 
                && x.LevelNumber == request.LevelNumber 
                && x.IsActive, cancellationToken);

        if (levelExists)
        {
            return Result<Guid>.Failure($"A floor with level number '{request.LevelNumber}' already exists in this block.");
        }
        // Create the floor using domain factory method
        var floor = Floor.Create(
            request.BlockId,
            request.Name,
            request.LevelNumber,
            request.DisplayOrder,
            _currentUser.UserId
        );
        _dbContext.Add(floor);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(floor.Id);
    }
}
