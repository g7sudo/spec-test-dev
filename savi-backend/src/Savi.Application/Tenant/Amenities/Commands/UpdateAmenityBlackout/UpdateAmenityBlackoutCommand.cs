using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateAmenityBlackout;

/// <summary>
/// Command to update an existing amenity blackout period.
/// </summary>
public record UpdateAmenityBlackoutCommand(
    Guid Id,
    DateOnly StartDate,
    DateOnly EndDate,
    string? Reason,
    bool AutoCancelBookings = false
) : IRequest<Result<bool>>;
