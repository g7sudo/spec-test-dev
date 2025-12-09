using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Authorization;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetMyBookings;

/// <summary>
/// Handler for GetMyBookingsQuery.
/// Applies permission-based filtering: CanViewAll → CanViewUnit → CanViewOwn.
/// </summary>
public class GetMyBookingsQueryHandler
    : IRequestHandler<GetMyBookingsQuery, Result<PagedResult<AmenityBookingSummaryDto>>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly IResourceOwnershipChecker _ownershipChecker;

    public GetMyBookingsQueryHandler(
        ITenantDbContext dbContext,
        IResourceOwnershipChecker ownershipChecker)
    {
        _dbContext = dbContext;
        _ownershipChecker = ownershipChecker;
    }

    public async Task<Result<PagedResult<AmenityBookingSummaryDto>>> Handle(
        GetMyBookingsQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's access level
        var access = _ownershipChecker.GetAmenityBookingAccess();

        // User must have at least one view permission
        if (!access.CanViewAll && !access.CanViewUnit && !access.CanViewOwn)
        {
            return Result<PagedResult<AmenityBookingSummaryDto>>.Failure("User does not have permission to view bookings.");
        }

        var query = _dbContext.AmenityBookings
            .AsNoTracking()
            .Where(b => b.IsActive);

        // Apply permission-based filter
        if (access.CanViewAll)
        {
            // No additional filter - user can see all bookings
        }
        else if (access.CanViewUnit)
        {
            // Filter by user's units
            var userUnitIds = await _ownershipChecker.GetUserUnitIdsAsync(cancellationToken);
            if (userUnitIds.Count == 0)
            {
                // User has unit permission but no units - return own only
                if (access.CurrentTenantUserId.HasValue)
                {
                    query = query.Where(b => b.BookedForUserId == access.CurrentTenantUserId.Value);
                }
                else
                {
                    return Result<PagedResult<AmenityBookingSummaryDto>>.Success(
                        new PagedResult<AmenityBookingSummaryDto>(
                            Array.Empty<AmenityBookingSummaryDto>(),
                            request.Page,
                            request.PageSize,
                            0));
                }
            }
            else
            {
                query = query.Where(b => userUnitIds.Contains(b.UnitId));
            }
        }
        else if (access.CanViewOwn)
        {
            // Filter by current user only
            if (!access.CurrentTenantUserId.HasValue)
            {
                return Result<PagedResult<AmenityBookingSummaryDto>>.Failure("User context not available.");
            }
            query = query.Where(b => b.BookedForUserId == access.CurrentTenantUserId.Value);
        }

        // Apply additional filters
        if (request.AmenityId.HasValue)
        {
            query = query.Where(b => b.AmenityId == request.AmenityId.Value);
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
