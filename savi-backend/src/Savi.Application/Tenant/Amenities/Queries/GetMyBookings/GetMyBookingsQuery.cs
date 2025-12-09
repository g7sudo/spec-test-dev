using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetMyBookings;

/// <summary>
/// Query to get amenity bookings for the current user.
/// Respects permission hierarchy: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public record GetMyBookingsQuery(
    Guid? AmenityId = null,
    AmenityBookingStatus? Status = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AmenityBookingSummaryDto>>>;
