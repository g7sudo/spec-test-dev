using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.UpdateUnit;
/// <summary>
/// Handler for updating an existing unit.
/// </summary>
public class UpdateUnitCommandHandler : IRequestHandler<UpdateUnitCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public UpdateUnitCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(UpdateUnitCommand request, CancellationToken cancellationToken)
    {
        // Find the unit
        var unit = await _dbContext.Units
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (unit == null)
        {
            throw new NotFoundException("Unit", request.Id);
        }
        // Verify unit type exists
        var unitTypeExists = await _dbContext.UnitTypes
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.UnitTypeId && x.IsActive, cancellationToken);
        if (!unitTypeExists)
            return Result.Failure($"Unit type with ID '{request.UnitTypeId}' not found.");
        // Check if another unit with the same unit number exists in the same floor (excluding current unit)
        var unitNumberExists = await _dbContext.Units
            .AnyAsync(x => x.Id != request.Id 
                && x.FloorId == unit.FloorId
                && x.UnitNumber.ToLower() == request.UnitNumber.ToLower() 
                && x.IsActive, cancellationToken);
        if (unitNumberExists)
            return Result.Failure($"A unit with the number '{request.UnitNumber}' already exists in this floor.");
        // Update the unit using domain method
        unit.Update(
            request.UnitTypeId,
            request.UnitNumber,
            request.AreaSqft,
            request.Status,
            request.Notes,
            _currentUser.UserId
        );
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
