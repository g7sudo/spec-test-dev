using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.AllocateParkingSlot;
/// <summary>
/// Handler for allocating a parking slot to a unit.
/// </summary>
public class AllocateParkingSlotCommandHandler : IRequestHandler<AllocateParkingSlotCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public AllocateParkingSlotCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(AllocateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Find the parking slot
        var parkingSlot = await _dbContext.ParkingSlots
            .FirstOrDefaultAsync(x => x.Id == request.ParkingSlotId && x.IsActive, cancellationToken);
        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.ParkingSlotId);
        }
        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.UnitId && x.IsActive, cancellationToken);
        if (!unitExists)
        {
            return Result.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Check if parking slot is already allocated
        if (parkingSlot.AllocatedUnitId.HasValue)
        {
            return Result.Failure($"Parking slot '{parkingSlot.Code}' is already allocated to another unit.");
        }

        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
            return Result.Failure("User does not exist in the current tenant. Contact your administrator.");

        // Allocate the parking slot using domain method
        parkingSlot.AllocateToUnit(request.UnitId, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
