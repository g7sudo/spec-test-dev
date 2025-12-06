using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.CreateAmenityBlackout;

/// <summary>
/// Command to create a new amenity blackout period.
/// </summary>
public record CreateAmenityBlackoutCommand(
    Guid AmenityId,
    DateOnly StartDate,
    DateOnly EndDate,
    string? Reason,
    bool AutoCancelBookings = false
) : IRequest<Result<Guid>>;
