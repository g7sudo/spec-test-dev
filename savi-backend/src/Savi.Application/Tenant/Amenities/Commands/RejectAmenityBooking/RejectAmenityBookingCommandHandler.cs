using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.RejectAmenityBooking;

/// <summary>
/// Handler for rejecting an amenity booking.
/// </summary>
public class RejectAmenityBookingCommandHandler
    : IRequestHandler<RejectAmenityBookingCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public RejectAmenityBookingCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        RejectAmenityBookingCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure("User does not exist in the current tenant.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return Result<bool>.Failure("Rejection reason is required.");
        }

        var booking = await _dbContext.AmenityBookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.IsActive, cancellationToken);

        if (booking == null)
        {
            return Result<bool>.Failure($"Booking with ID '{request.BookingId}' not found.");
        }

        if (booking.Status != AmenityBookingStatus.PendingApproval)
        {
            return Result<bool>.Failure("Only pending bookings can be rejected.");
        }

        booking.Reject(request.Reason, _currentUser.TenantUserId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
