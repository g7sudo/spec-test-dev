using MediatR;
using Savi.SharedKernel.Common;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Community.Dtos;
using Savi.SharedKernel;
using Savi.SharedKernel.Exceptions;

namespace Savi.Application.Tenant.Community.Queries.GetParkingSlotById;
/// <summary>
/// Handler for getting a parking slot by ID.
/// </summary>
public class GetParkingSlotByIdQueryHandler : IRequestHandler<GetParkingSlotByIdQuery, Result<ParkingSlotDto>>
{
    private readonly ITenantDbContext _dbContext;
    public GetParkingSlotByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<ParkingSlotDto>> Handle(GetParkingSlotByIdQuery request, CancellationToken cancellationToken)
    {
        var parkingSlot = await _dbContext.ParkingSlots
            .AsNoTracking()
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(x => new ParkingSlotDto
            {
                Id = x.Id,
                Code = x.Code,
                LocationType = x.LocationType.ToString(),
                LevelLabel = x.LevelLabel,
                IsCovered = x.IsCovered,
                IsEVCompatible = x.IsEVCompatible,
                Status = x.Status.ToString(),
                Notes = x.Notes,
                AllocatedUnitId = x.AllocatedUnitId,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (parkingSlot == null)
        {
            throw new NotFoundException("ParkingSlot", request.Id);
        }
        // Get unit number if allocated
        if (parkingSlot.AllocatedUnitId.HasValue)
        {
            var unitNumber = await _dbContext.Units
                .AsNoTracking()
                .Where(u => u.Id == parkingSlot.AllocatedUnitId.Value)
                .Select(u => u.UnitNumber)
                .FirstOrDefaultAsync(cancellationToken);

            parkingSlot = parkingSlot with { AllocatedUnitNumber = unitNumber };
        }

        return Result<ParkingSlotDto>.Success(parkingSlot);
    }
}
