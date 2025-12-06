using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenityBlackout;

/// <summary>
/// Handler for creating a new amenity blackout period.
/// </summary>
public class CreateAmenityBlackoutCommandHandler
    : IRequestHandler<CreateAmenityBlackoutCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateAmenityBlackoutCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateAmenityBlackoutCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure("User does not exist in the current tenant.");
        }

        // Verify amenity exists and is active
        var amenityExists = await _dbContext.Amenities
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.AmenityId && a.IsActive, cancellationToken);

        if (!amenityExists)
        {
            return Result<Guid>.Failure($"Amenity with ID '{request.AmenityId}' not found.");
        }

        // Check for overlapping blackouts
        var hasOverlap = await _dbContext.AmenityBlackouts
            .AsNoTracking()
            .AnyAsync(b =>
                b.AmenityId == request.AmenityId &&
                b.IsActive &&
                b.StartDate <= request.EndDate &&
                b.EndDate >= request.StartDate,
                cancellationToken);

        if (hasOverlap)
        {
            return Result<Guid>.Failure("The blackout period overlaps with an existing blackout.");
        }

        var blackout = AmenityBlackout.Create(
            request.AmenityId,
            request.StartDate,
            request.EndDate,
            request.Reason,
            request.AutoCancelBookings,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(blackout);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(blackout.Id);
    }
}
