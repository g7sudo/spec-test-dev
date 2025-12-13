using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CancelMyBooking;

/// <summary>
/// Handler for cancelling an amenity booking with ownership verification.
/// Respects permission hierarchy: CanManageAll → CanManageUnit → CanManageOwn.
/// </summary>
public class CancelMyBookingCommandHandler
    : IRequestHandler<CancelMyBookingCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;

    public CancelMyBookingCommandHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
    }

    public async Task<Result<bool>> Handle(
        CancelMyBookingCommand request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetAmenityBookingAccess();

        // User must have at least one manage permission
        if (!access.CanManageAll && !access.CanManageUnit && !access.CanManageOwn)
        {
            return Result<bool>.Failure("User does not have permission to cancel bookings.");
        }

        // Fetch the booking
        var booking = await _dbContext.AmenityBookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.IsActive, cancellationToken);

        if (booking == null)
        {
            return Result<bool>.Failure($"Booking with ID '{request.BookingId}' not found.");
        }

        // Verify ownership based on permission level
        if (access.CanManageAll)
        {
            // User can manage all bookings - no ownership check needed
        }
        else if (access.CanManageUnit)
        {
            // User can manage bookings for their units
            var userUnitIds = await _ownershipChecker.GetUserUnitIdsAsync(cancellationToken);
            if (!userUnitIds.Contains(booking.UnitId))
            {
                // Fall back to own check
                if (!access.CurrentTenantUserId.HasValue || booking.BookedForUserId != access.CurrentTenantUserId.Value)
                {
                    return Result<bool>.Failure("You can only cancel bookings for your units.");
                }
            }
        }
        else if (access.CanManageOwn)
        {
            // User can only manage their own bookings
            if (!access.CurrentTenantUserId.HasValue || booking.BookedForUserId != access.CurrentTenantUserId.Value)
            {
                return Result<bool>.Failure("You can only cancel your own bookings.");
            }
        }

        // Check if booking can be cancelled
        if (!booking.CanBeCancelled)
        {
            return Result<bool>.Failure("This booking cannot be cancelled.");
        }

        // Cancel the booking (as resident, not admin)
        booking.CancelByResident(request.Reason, access.CurrentTenantUserId ?? Guid.Empty);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
