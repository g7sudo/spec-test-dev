using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenityBooking;

/// <summary>
/// Handler for creating a new amenity booking.
/// </summary>
public class CreateAmenityBookingCommandHandler
    : IRequestHandler<CreateAmenityBookingCommand, Result<Guid>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public CreateAmenityBookingCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(
        CreateAmenityBookingCommand request,
        CancellationToken cancellationToken)
    {
        // Validate tenant user exists
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<Guid>.Failure(
                "User does not exist in the current tenant. Contact your administrator.");
        }

        // Get the amenity
        var amenity = await _dbContext.Amenities
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AmenityId && a.IsActive, cancellationToken);

        if (amenity == null)
        {
            return Result<Guid>.Failure($"Amenity with ID '{request.AmenityId}' not found.");
        }

        // Check if amenity is bookable
        if (!amenity.IsAvailableForBooking)
        {
            return Result<Guid>.Failure("This amenity is not available for booking.");
        }

        // Verify unit exists
        var unitExists = await _dbContext.Units
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UnitId && u.IsActive, cancellationToken);

        if (!unitExists)
        {
            return Result<Guid>.Failure($"Unit with ID '{request.UnitId}' not found.");
        }

        // Check max days in advance
        var bookingDate = DateOnly.FromDateTime(request.StartAt);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (bookingDate > today.AddDays(amenity.MaxDaysInAdvance))
        {
            return Result<Guid>.Failure(
                $"Cannot book more than {amenity.MaxDaysInAdvance} days in advance.");
        }

        // Check for blackout dates
        var hasBlackout = await _dbContext.AmenityBlackouts
            .AsNoTracking()
            .AnyAsync(b =>
                b.AmenityId == request.AmenityId &&
                b.IsActive &&
                b.StartDate <= bookingDate &&
                b.EndDate >= bookingDate,
                cancellationToken);

        if (hasBlackout)
        {
            return Result<Guid>.Failure("The amenity is not available on the selected date.");
        }

        // Check max guests
        if (amenity.MaxGuests.HasValue && request.NumberOfGuests.HasValue &&
            request.NumberOfGuests.Value > amenity.MaxGuests.Value)
        {
            return Result<Guid>.Failure(
                $"Number of guests exceeds maximum capacity of {amenity.MaxGuests.Value}.");
        }

        // Check max active bookings per unit
        if (amenity.MaxActiveBookingsPerUnit.HasValue)
        {
            var activeBookingsCount = await _dbContext.AmenityBookings
                .AsNoTracking()
                .CountAsync(b =>
                    b.AmenityId == request.AmenityId &&
                    b.UnitId == request.UnitId &&
                    b.IsActive &&
                    (b.Status == AmenityBookingStatus.PendingApproval ||
                     b.Status == AmenityBookingStatus.Approved) &&
                    b.StartAt > DateTime.UtcNow,
                    cancellationToken);

            if (activeBookingsCount >= amenity.MaxActiveBookingsPerUnit.Value)
            {
                return Result<Guid>.Failure(
                    $"Maximum active bookings limit ({amenity.MaxActiveBookingsPerUnit.Value}) reached for this unit.");
            }
        }

        // Check for conflicting bookings (including cleanup buffer)
        var bufferMinutes = amenity.CleanupBufferMinutes;
        var conflictingBooking = await _dbContext.AmenityBookings
            .AsNoTracking()
            .AnyAsync(b =>
                b.AmenityId == request.AmenityId &&
                b.IsActive &&
                (b.Status == AmenityBookingStatus.PendingApproval ||
                 b.Status == AmenityBookingStatus.Approved) &&
                // Check overlap with buffer
                request.StartAt < b.EndAt.AddMinutes(bufferMinutes) &&
                request.EndAt > b.StartAt,
                cancellationToken);

        if (conflictingBooking)
        {
            return Result<Guid>.Failure("The selected time slot is not available.");
        }

        // Determine who the booking is for
        var bookedForUserId = request.BookedForUserId ?? _currentUser.TenantUserId.Value;

        // If booking on behalf of someone else, validate the user exists
        if (request.BookedForUserId.HasValue)
        {
            var userExists = await _dbContext.CommunityUsers
                .AsNoTracking()
                .AnyAsync(u => u.Id == request.BookedForUserId.Value && u.IsActive, cancellationToken);

            if (!userExists)
            {
                return Result<Guid>.Failure($"User with ID '{request.BookedForUserId.Value}' not found.");
            }
        }

        // Create booking
        var booking = AmenityBooking.Create(
            request.AmenityId,
            request.UnitId,
            bookedForUserId,
            request.StartAt,
            request.EndAt,
            request.Source,
            request.Title,
            request.Notes,
            request.NumberOfGuests,
            amenity.RequiresApproval,
            amenity.DepositRequired,
            amenity.DepositAmount,
            _currentUser.TenantUserId.Value);

        _dbContext.Add(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(booking.Id);
    }
}
