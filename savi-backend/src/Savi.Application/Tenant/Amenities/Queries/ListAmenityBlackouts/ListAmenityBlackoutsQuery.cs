using MediatR;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenityBlackouts;

/// <summary>
/// Query to list amenity blackouts with filtering and pagination.
/// </summary>
public record ListAmenityBlackoutsQuery(
    Guid? AmenityId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    bool IncludePast = false,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AmenityBlackoutDto>>>;
