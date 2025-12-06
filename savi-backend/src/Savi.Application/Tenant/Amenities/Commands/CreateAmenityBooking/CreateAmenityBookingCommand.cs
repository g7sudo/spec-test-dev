using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenityBooking;

/// <summary>
/// Command to create a new amenity booking.
/// </summary>
public record CreateAmenityBookingCommand(
    Guid AmenityId,
    Guid UnitId,
    DateTime StartAt,
    DateTime EndAt,
    AmenityBookingSource Source,
    string? Title,
    string? Notes,
    int? NumberOfGuests,
    /// <summary>
    /// Optional: User ID to book for (admin booking on behalf of resident).
    /// If null, the booking is created for the current user.
    /// </summary>
    Guid? BookedForUserId = null
) : IRequest<Result<Guid>>;
