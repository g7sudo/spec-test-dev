using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.ApproveAmenityBooking;

/// <summary>
/// Command to approve an amenity booking.
/// </summary>
public record ApproveAmenityBookingCommand(Guid BookingId) : IRequest<Result<bool>>;
