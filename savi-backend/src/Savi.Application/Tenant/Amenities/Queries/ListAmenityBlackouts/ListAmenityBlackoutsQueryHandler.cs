using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenityBlackouts;

/// <summary>
/// Handler for ListAmenityBlackoutsQuery.
/// </summary>
public class ListAmenityBlackoutsQueryHandler
    : IRequestHandler<ListAmenityBlackoutsQuery, Result<PagedResult<AmenityBlackoutDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListAmenityBlackoutsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<AmenityBlackoutDto>>> Handle(
        ListAmenityBlackoutsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.AmenityBlackouts
            .AsNoTracking()
            .Where(b => b.IsActive);

        // Apply filters
        if (request.AmenityId.HasValue)
        {
            query = query.Where(b => b.AmenityId == request.AmenityId.Value);
        }

        if (!request.IncludePast)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            query = query.Where(b => b.EndDate >= today);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(b => b.EndDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(b => b.StartDate <= request.ToDate.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var blackouts = await query
            .OrderBy(b => b.StartDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (blackouts.Count == 0)
        {
            return Result<PagedResult<AmenityBlackoutDto>>.Success(
                new PagedResult<AmenityBlackoutDto>(
                    Array.Empty<AmenityBlackoutDto>(),
                    request.Page,
                    request.PageSize,
                    totalCount));
        }

        // Get amenity names
        var amenityIds = blackouts.Select(b => b.AmenityId).Distinct().ToList();
        var amenityNames = await _dbContext.Amenities
            .AsNoTracking()
            .Where(a => amenityIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => a.Name, cancellationToken);

        var items = blackouts.Select(b => new AmenityBlackoutDto
        {
            Id = b.Id,
            AmenityId = b.AmenityId,
            AmenityName = amenityNames.GetValueOrDefault(b.AmenityId, string.Empty),
            StartDate = b.StartDate,
            EndDate = b.EndDate,
            Reason = b.Reason,
            AutoCancelBookings = b.AutoCancelBookings,
            IsActive = b.IsActive,
            CreatedAt = b.CreatedAt
        }).ToList();

        var result = new PagedResult<AmenityBlackoutDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<AmenityBlackoutDto>>.Success(result);
    }
}
