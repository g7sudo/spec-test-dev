using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CompleteAmenityBooking;

/// <summary>
/// Command to mark an amenity booking as completed.
/// </summary>
public record CompleteAmenityBookingCommand(Guid BookingId) : IRequest<Result<bool>>;
