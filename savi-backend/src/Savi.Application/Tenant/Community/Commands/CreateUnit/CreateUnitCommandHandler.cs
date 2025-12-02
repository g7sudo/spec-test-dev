using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;
using UnitEntity = Savi.Domain.Tenant.Unit;

namespace Savi.Application.Tenant.Community.Commands.CreateUnit;
/// <summary>
/// Handler for creating a new unit.
/// </summary>
public class CreateUnitCommandHandler : IRequestHandler<CreateUnitCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public CreateUnitCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(CreateUnitCommand request, CancellationToken cancellationToken)
    {
        // Verify block exists
        var blockExists = await _dbContext.Blocks
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.BlockId && x.IsActive, cancellationToken);
        if (!blockExists)
        {
            return Result<Guid>.Failure($"Block with ID '{request.BlockId}' not found.");
        }
        // Verify floor exists and belongs to the block
        var floorExists = await _dbContext.Floors
            .AnyAsync(x => x.Id == request.FloorId 
                && x.BlockId == request.BlockId 
                && x.IsActive, cancellationToken);
        if (!floorExists)
            return Result<Guid>.Failure($"Floor with ID '{request.FloorId}' not found or does not belong to the specified block.");
        // Verify unit type exists
        var unitTypeExists = await _dbContext.UnitTypes
            .AnyAsync(x => x.Id == request.UnitTypeId && x.IsActive, cancellationToken);
        if (!unitTypeExists)
            return Result<Guid>.Failure($"Unit type with ID '{request.UnitTypeId}' not found.");
        // Check if a unit with the same unit number already exists in this floor
        var unitNumberExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(x => x.FloorId == request.FloorId 
                && x.UnitNumber.ToLower() == request.UnitNumber.ToLower() 
                && x.IsActive, cancellationToken);

        if (unitNumberExists)
            return Result<Guid>.Failure($"A unit with the number '{request.UnitNumber}' already exists in this floor.");
        // Create the unit using domain factory method
        var unit = UnitEntity.Create(
            request.BlockId,
            request.FloorId,
            request.UnitTypeId,
            request.UnitNumber,
            request.AreaSqft,
            request.Status,
            request.Notes,
            _currentUser.UserId
        );
        _dbContext.Add(unit);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(unit.Id);
    }
}
