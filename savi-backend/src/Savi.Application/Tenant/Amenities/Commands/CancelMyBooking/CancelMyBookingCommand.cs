using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CancelMyBooking;

/// <summary>
/// Command to cancel an amenity booking with ownership verification.
/// Respects permission hierarchy: CanManageAll → CanManageUnit → CanManageOwn.
/// </summary>
public record CancelMyBookingCommand(
    Guid BookingId,
    string? Reason
) : IRequest<Result<bool>>;
