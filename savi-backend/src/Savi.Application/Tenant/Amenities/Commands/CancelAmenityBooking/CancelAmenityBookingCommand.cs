using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CancelAmenityBooking;

/// <summary>
/// Command to cancel an amenity booking.
/// </summary>
public record CancelAmenityBookingCommand(
    Guid BookingId,
    string? Reason,
    bool IsAdminCancellation
) : IRequest<Result<bool>>;
