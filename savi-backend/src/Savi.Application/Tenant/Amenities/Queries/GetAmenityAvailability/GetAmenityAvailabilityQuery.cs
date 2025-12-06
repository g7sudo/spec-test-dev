using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityAvailability;

/// <summary>
/// Query to get availability slots for an amenity on a specific date.
/// </summary>
public record GetAmenityAvailabilityQuery(
    Guid AmenityId,
    DateOnly Date
) : IRequest<Result<AmenityAvailabilityDto>>;
