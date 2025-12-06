using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenities;

/// <summary>
/// Query to list all amenities with filtering and pagination.
/// </summary>
public record ListAmenitiesQuery(
    AmenityType? Type = null,
    AmenityStatus? Status = null,
    bool? IsBookable = null,
    bool? IsVisibleInApp = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AmenitySummaryDto>>>;
