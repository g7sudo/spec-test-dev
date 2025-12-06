using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenityBookings;

/// <summary>
/// Query to list amenity bookings with filtering and pagination.
/// </summary>
public record ListAmenityBookingsQuery(
    Guid? AmenityId = null,
    Guid? UnitId = null,
    AmenityBookingStatus? Status = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AmenityBookingSummaryDto>>>;
