using MediatR;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateDepositStatus;

/// <summary>
/// Command to update the deposit status of an amenity booking.
/// </summary>
public record UpdateDepositStatusCommand(
    Guid BookingId,
    AmenityDepositStatus NewStatus,
    string? Reference
) : IRequest<Result<bool>>;
