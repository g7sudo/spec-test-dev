using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityBlackoutById;

/// <summary>
/// Handler for GetAmenityBlackoutByIdQuery.
/// </summary>
public class GetAmenityBlackoutByIdQueryHandler
    : IRequestHandler<GetAmenityBlackoutByIdQuery, Result<AmenityBlackoutDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetAmenityBlackoutByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<AmenityBlackoutDto>> Handle(
        GetAmenityBlackoutByIdQuery request,
        CancellationToken cancellationToken)
    {
        var blackout = await _dbContext.AmenityBlackouts
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.IsActive, cancellationToken);

        if (blackout == null)
        {
            return Result<AmenityBlackoutDto>.Failure($"Blackout with ID '{request.Id}' not found.");
        }

        // Get amenity name
        var amenityName = await _dbContext.Amenities
            .AsNoTracking()
            .Where(a => a.Id == blackout.AmenityId)
            .Select(a => a.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var dto = new AmenityBlackoutDto
        {
            Id = blackout.Id,
            AmenityId = blackout.AmenityId,
            AmenityName = amenityName ?? string.Empty,
            StartDate = blackout.StartDate,
            EndDate = blackout.EndDate,
            Reason = blackout.Reason,
            AutoCancelBookings = blackout.AutoCancelBookings,
            IsActive = blackout.IsActive,
            CreatedAt = blackout.CreatedAt
        };

        return Result<AmenityBlackoutDto>.Success(dto);
    }
}
