using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.UpdateFloor;
/// <summary>
/// Handler for updating an existing floor.
/// </summary>
public class UpdateFloorCommandHandler : IRequestHandler<UpdateFloorCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public UpdateFloorCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(UpdateFloorCommand request, CancellationToken cancellationToken)
    {
        // Find the floor
        var floor = await _dbContext.Floors
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (floor == null)
        {
            throw new NotFoundException("Floor", request.Id);
        }
        // Check if another floor with the same name exists in the same block (excluding current floor)
        var nameExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id 
                && x.BlockId == floor.BlockId
                && x.Name.ToLower() == request.Name.ToLower() 
                && x.IsActive, cancellationToken);
        if (nameExists)
        {
            return Result.Failure($"A floor with the name '{request.Name}' already exists in this block.");
        }

        // Check if another floor with the same level number exists in the same block (excluding current floor)
        var levelExists = await _dbContext.Floors
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id 
                && x.BlockId == floor.BlockId
                && x.LevelNumber == request.LevelNumber 
                && x.IsActive, cancellationToken);

        if (levelExists)
        {
            return Result.Failure($"A floor with level number '{request.LevelNumber}' already exists in this block.");
        }
        // Update the floor using domain method
        floor.Update(
            request.Name,
            request.LevelNumber,
            request.DisplayOrder,
            _currentUser.UserId
        );
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
