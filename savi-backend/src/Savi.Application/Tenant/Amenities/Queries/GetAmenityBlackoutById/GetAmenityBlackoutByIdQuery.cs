using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityBlackoutById;

/// <summary>
/// Query to get an amenity blackout by its ID.
/// </summary>
public record GetAmenityBlackoutByIdQuery(Guid Id) : IRequest<Result<AmenityBlackoutDto>>;
