using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.DeallocateParkingSlot;
/// <summary>
/// Handler for deallocating a parking slot from a unit.
/// </summary>
public class DeallocateParkingSlotCommandHandler : IRequestHandler<DeallocateParkingSlotCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public DeallocateParkingSlotCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(DeallocateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Find the parking slot
        var parkingSlot = await _dbContext.ParkingSlots
            .FirstOrDefaultAsync(x => x.Id == request.ParkingSlotId && x.IsActive, cancellationToken);
        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.ParkingSlotId);
        }
        // Check if parking slot is allocated
        if (!parkingSlot.AllocatedUnitId.HasValue)
        {
            return Result.Failure($"Parking slot '{parkingSlot.Code}' is not currently allocated.");
        }

        // Deallocate the parking slot using domain method
        parkingSlot.Deallocate(_currentUser.UserId);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
