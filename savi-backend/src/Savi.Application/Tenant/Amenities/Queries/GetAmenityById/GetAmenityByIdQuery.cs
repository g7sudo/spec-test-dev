using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityById;

/// <summary>
/// Query to get an amenity by its ID.
/// </summary>
public record GetAmenityByIdQuery(Guid Id) : IRequest<Result<AmenityDto>>;
