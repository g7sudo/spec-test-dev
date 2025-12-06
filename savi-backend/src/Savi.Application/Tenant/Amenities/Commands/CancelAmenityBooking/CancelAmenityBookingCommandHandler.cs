using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.CancelAmenityBooking;

/// <summary>
/// Handler for cancelling an amenity booking.
/// </summary>
public class CancelAmenityBookingCommandHandler
    : IRequestHandler<CancelAmenityBookingCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CancelAmenityBookingCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        CancelAmenityBookingCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure("User does not exist in the current tenant.");
        }

        var booking = await _dbContext.AmenityBookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.IsActive, cancellationToken);

        if (booking == null)
        {
            return Result<bool>.Failure($"Booking with ID '{request.BookingId}' not found.");
        }

        if (!booking.CanBeCancelled)
        {
            return Result<bool>.Failure("This booking cannot be cancelled.");
        }

        if (request.IsAdminCancellation)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return Result<bool>.Failure("Cancellation reason is required for admin cancellation.");
            }
            booking.CancelByAdmin(request.Reason, _currentUser.TenantUserId.Value);
        }
        else
        {
            booking.CancelByResident(request.Reason, _currentUser.TenantUserId.Value);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
