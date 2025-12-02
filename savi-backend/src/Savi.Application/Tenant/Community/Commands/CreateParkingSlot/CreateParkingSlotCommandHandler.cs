using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Community.Commands.CreateParkingSlot;
/// <summary>
/// Handler for creating a new parking slot.
/// </summary>
public class CreateParkingSlotCommandHandler : IRequestHandler<CreateParkingSlotCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    public CreateParkingSlotCommandHandler(ITenantDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }
    public async Task<Result<Guid>> Handle(CreateParkingSlotCommand request, CancellationToken cancellationToken)
    {
        // Check if a parking slot with the same code already exists
        var codeExists = await _dbContext.ParkingSlots
            .AsNoTracking()
            .AnyAsync(x => x.Code.ToLower() == request.Code.ToLower() && x.IsActive, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Failure($"A parking slot with the code '{request.Code}' already exists.");
        }
        // Create the parking slot using domain factory method
        var parkingSlot = ParkingSlot.Create(
            request.Code,
            request.LocationType,
            request.LevelLabel,
            request.IsCovered,
            request.IsEVCompatible,
            request.Status,
            request.Notes,
            _currentUser.UserId
        );
        _dbContext.Add(parkingSlot);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(parkingSlot.Id);
    }
}
