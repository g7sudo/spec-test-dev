using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.ListAmenityBookings;

/// <summary>
/// Handler for ListAmenityBookingsQuery.
/// </summary>
public class ListAmenityBookingsQueryHandler
    : IRequestHandler<ListAmenityBookingsQuery, Result<PagedResult<AmenityBookingSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;

    public ListAmenityBookingsQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<PagedResult<AmenityBookingSummaryDto>>> Handle(
        ListAmenityBookingsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.AmenityBookings
            .AsNoTracking()
            .Where(b => b.IsActive);

        // Apply filters
        if (request.AmenityId.HasValue)
        {
            query = query.Where(b => b.AmenityId == request.AmenityId.Value);
        }

        if (request.UnitId.HasValue)
        {
            query = query.Where(b => b.UnitId == request.UnitId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(b => b.Status == request.Status.Value);
        }

        if (request.FromDate.HasValue)
        {
            var fromDateTime = request.FromDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(b => b.StartAt >= fromDateTime);
        }

        if (request.ToDate.HasValue)
        {
            var toDateTime = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(b => b.StartAt <= toDateTime);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Get paginated results
        var bookings = await query
            .OrderByDescending(b => b.StartAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (bookings.Count == 0)
        {
            return Result<PagedResult<AmenityBookingSummaryDto>>.Success(
                new PagedResult<AmenityBookingSummaryDto>(
                    Array.Empty<AmenityBookingSummaryDto>(),
                    request.Page,
                    request.PageSize,
                    totalCount));
        }

        // Get related data
        var amenityIds = bookings.Select(b => b.AmenityId).Distinct().ToList();
        var unitIds = bookings.Select(b => b.UnitId).Distinct().ToList();
        var userIds = bookings.Select(b => b.BookedForUserId).Distinct().ToList();

        var amenityNames = await _dbContext.Amenities
            .AsNoTracking()
            .Where(a => amenityIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => a.Name, cancellationToken);

        var unitNumbers = await _dbContext.Units
            .AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UnitNumber, cancellationToken);

        var userNames = await _dbContext.CommunityUsers
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Join(
                _dbContext.Parties,
                cu => cu.PartyId,
                p => p.Id,
                (cu, p) => new { cu.Id, p.PartyName })
            .ToDictionaryAsync(x => x.Id, x => x.PartyName, cancellationToken);

        var items = bookings.Select(b => new AmenityBookingSummaryDto
        {
            Id = b.Id,
            AmenityId = b.AmenityId,
            AmenityName = amenityNames.GetValueOrDefault(b.AmenityId, string.Empty),
            UnitNumber = unitNumbers.GetValueOrDefault(b.UnitId, string.Empty),
            BookedForUserName = userNames.GetValueOrDefault(b.BookedForUserId, string.Empty),
            StartAt = b.StartAt,
            EndAt = b.EndAt,
            Status = b.Status,
            Source = b.Source,
            Title = b.Title,
            NumberOfGuests = b.NumberOfGuests,
            DepositStatus = b.DepositStatus
        }).ToList();

        var result = new PagedResult<AmenityBookingSummaryDto>(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result<PagedResult<AmenityBookingSummaryDto>>.Success(result);
    }
}
