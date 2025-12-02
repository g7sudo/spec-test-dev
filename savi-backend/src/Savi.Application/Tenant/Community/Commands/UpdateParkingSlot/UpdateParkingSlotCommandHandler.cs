using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.UpdateParkingSlot;
/// <summary>
/// Handler for updating an existing parking slot.
/// </summary>
public class UpdateParkingSlotCommandHandler : IRequestHandler<UpdateParkingSlotCommand, Result>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public UpdateParkingSlotCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result> Handle(UpdateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Find the parking slot
        var parkingSlot = await _dbContext.ParkingSlots
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, cancellationToken);
        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.Id);
        }
        // Check if another parking slot with the same code exists (excluding current parking slot)
        var codeExists = await _dbContext.ParkingSlots
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id 
                && x.Code.ToLower() == request.Code.ToLower() 
                && x.IsActive, cancellationToken);
        if (codeExists)
            return Result.Failure($"A parking slot with the code '{request.Code}' already exists.");
        // Update the parking slot using domain method
        parkingSlot.Update(
            request.Code,
            request.LocationType,
            request.LevelLabel,
            request.IsCovered,
            request.IsEVCompatible,
            request.Notes,
            _currentUser.UserId
        );
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
