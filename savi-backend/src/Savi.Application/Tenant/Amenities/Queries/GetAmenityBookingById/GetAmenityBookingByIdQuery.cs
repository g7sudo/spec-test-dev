using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityBookingById;

/// <summary>
/// Query to get an amenity booking by its ID.
/// </summary>
public record GetAmenityBookingByIdQuery(Guid Id) : IRequest<Result<AmenityBookingDto>>;
