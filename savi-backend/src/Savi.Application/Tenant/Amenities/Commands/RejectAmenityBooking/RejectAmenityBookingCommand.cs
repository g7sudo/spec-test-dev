using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.RejectAmenityBooking;

/// <summary>
/// Command to reject an amenity booking.
/// </summary>
public record RejectAmenityBookingCommand(
    Guid BookingId,
    string Reason
) : IRequest<Result<bool>>;
