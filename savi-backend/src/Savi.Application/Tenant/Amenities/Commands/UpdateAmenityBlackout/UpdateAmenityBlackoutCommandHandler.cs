using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateAmenityBlackout;

/// <summary>
/// Handler for updating an amenity blackout period.
/// </summary>
public class UpdateAmenityBlackoutCommandHandler
    : IRequestHandler<UpdateAmenityBlackoutCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateAmenityBlackoutCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        UpdateAmenityBlackoutCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure("User does not exist in the current tenant.");
        }

        var blackout = await _dbContext.AmenityBlackouts
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.IsActive, cancellationToken);

        if (blackout == null)
        {
            return Result<bool>.Failure($"Blackout with ID '{request.Id}' not found.");
        }

        // Check for overlapping blackouts (excluding current one)
        var hasOverlap = await _dbContext.AmenityBlackouts
            .AsNoTracking()
            .AnyAsync(b =>
                b.AmenityId == blackout.AmenityId &&
                b.Id != request.Id &&
                b.IsActive &&
                b.StartDate <= request.EndDate &&
                b.EndDate >= request.StartDate,
                cancellationToken);

        if (hasOverlap)
        {
            return Result<bool>.Failure("The blackout period overlaps with an existing blackout.");
        }

        blackout.Update(
            request.StartDate,
            request.EndDate,
            request.Reason,
            request.AutoCancelBookings,
            _currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
