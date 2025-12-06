using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityAvailability;

/// <summary>
/// Handler for GetAmenityAvailabilityQuery.
/// </summary>
public class GetAmenityAvailabilityQueryHandler
    : IRequestHandler<GetAmenityAvailabilityQuery, Result<AmenityAvailabilityDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetAmenityAvailabilityQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<AmenityAvailabilityDto>> Handle(
        GetAmenityAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        // Get the amenity
        var amenity = await _dbContext.Amenities
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AmenityId && a.IsActive, cancellationToken);

        if (amenity == null)
        {
            return Result<AmenityAvailabilityDto>.Failure($"Amenity with ID '{request.AmenityId}' not found.");
        }

        // Check if amenity is bookable
        if (!amenity.IsBookable)
        {
            return Result<AmenityAvailabilityDto>.Failure("This amenity is not bookable.");
        }

        // Check max days in advance
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.Date > today.AddDays(amenity.MaxDaysInAdvance))
        {
            return Result<AmenityAvailabilityDto>.Failure(
                $"Cannot check availability more than {amenity.MaxDaysInAdvance} days in advance.");
        }

        if (request.Date < today)
        {
            return Result<AmenityAvailabilityDto>.Failure("Cannot check availability for past dates.");
        }

        // Check for blackout dates
        var blackout = await _dbContext.AmenityBlackouts
            .AsNoTracking()
            .FirstOrDefaultAsync(b =>
                b.AmenityId == request.AmenityId &&
                b.IsActive &&
                b.StartDate <= request.Date &&
                b.EndDate >= request.Date,
                cancellationToken);

        if (blackout != null)
        {
            return Result<AmenityAvailabilityDto>.Success(new AmenityAvailabilityDto
            {
                AmenityId = amenity.Id,
                AmenityName = amenity.Name,
                Date = request.Date,
                AvailableSlots = new List<AvailableSlotDto>(),
                IsBlackoutDate = true,
                BlackoutReason = blackout.Reason ?? "Amenity unavailable on this date"
            });
        }

        // Generate time slots based on amenity configuration
        var slots = new List<AvailableSlotDto>();

        if (!amenity.OpenTime.HasValue || !amenity.CloseTime.HasValue)
        {
            return Result<AmenityAvailabilityDto>.Success(new AmenityAvailabilityDto
            {
                AmenityId = amenity.Id,
                AmenityName = amenity.Name,
                Date = request.Date,
                AvailableSlots = slots,
                IsBlackoutDate = false
            });
        }

        // Get existing bookings for this date
        var dateStart = request.Date.ToDateTime(TimeOnly.MinValue);
        var dateEnd = request.Date.ToDateTime(TimeOnly.MaxValue);

        var existingBookings = await _dbContext.AmenityBookings
            .AsNoTracking()
            .Where(b =>
                b.AmenityId == request.AmenityId &&
                b.IsActive &&
                (b.Status == AmenityBookingStatus.PendingApproval || b.Status == AmenityBookingStatus.Approved) &&
                b.StartAt >= dateStart &&
                b.StartAt <= dateEnd)
            .Select(b => new { b.StartAt, b.EndAt })
            .ToListAsync(cancellationToken);

        // Generate slots
        var currentSlotStart = amenity.OpenTime.Value;
        var slotDuration = TimeSpan.FromMinutes(amenity.SlotDurationMinutes);
        var bufferDuration = TimeSpan.FromMinutes(amenity.CleanupBufferMinutes);

        while (currentSlotStart.Add(slotDuration) <= amenity.CloseTime.Value)
        {
            var slotEnd = currentSlotStart.Add(slotDuration);
            var slotStartDateTime = request.Date.ToDateTime(currentSlotStart);
            var slotEndDateTime = request.Date.ToDateTime(slotEnd);

            // Check if slot is in the past (for today)
            if (request.Date == today && slotStartDateTime <= DateTime.UtcNow)
            {
                slots.Add(new AvailableSlotDto
                {
                    StartTime = currentSlotStart,
                    EndTime = slotEnd,
                    IsAvailable = false,
                    UnavailableReason = "Time has passed"
                });
            }
            else
            {
                // Check if slot overlaps with any existing booking (including buffer)
                var conflictingBooking = existingBookings.FirstOrDefault(b =>
                {
                    var bookingEndWithBuffer = b.EndAt.AddMinutes(amenity.CleanupBufferMinutes);
                    // Check for overlap: slot overlaps if it starts before booking ends (with buffer)
                    // and ends after booking starts
                    return slotStartDateTime < bookingEndWithBuffer && slotEndDateTime > b.StartAt;
                });

                if (conflictingBooking != null)
                {
                    slots.Add(new AvailableSlotDto
                    {
                        StartTime = currentSlotStart,
                        EndTime = slotEnd,
                        IsAvailable = false,
                        UnavailableReason = "Already booked"
                    });
                }
                else
                {
                    slots.Add(new AvailableSlotDto
                    {
                        StartTime = currentSlotStart,
                        EndTime = slotEnd,
                        IsAvailable = true
                    });
                }
            }

            // Move to next slot (add slot duration + buffer)
            currentSlotStart = currentSlotStart.Add(slotDuration).Add(bufferDuration);
        }

        return Result<AmenityAvailabilityDto>.Success(new AmenityAvailabilityDto
        {
            AmenityId = amenity.Id,
            AmenityName = amenity.Name,
            Date = request.Date,
            AvailableSlots = slots,
            IsBlackoutDate = false
        });
    }
}
