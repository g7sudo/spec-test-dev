using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Commands.DeleteAmenityBlackout;

/// <summary>
/// Command to delete (soft delete) an amenity blackout period.
/// </summary>
public record DeleteAmenityBlackoutCommand(Guid Id) : IRequest<Result<bool>>;
