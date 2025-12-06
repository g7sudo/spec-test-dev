using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Application.Tenant.Amenities.Dtos;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Amenities.Queries.GetAmenityBookingById;

/// <summary>
/// Handler for GetAmenityBookingByIdQuery.
/// </summary>
public class GetAmenityBookingByIdQueryHandler
    : IRequestHandler<GetAmenityBookingByIdQuery, Result<AmenityBookingDto>>
{
    private readonly ITenantDbContext _dbContext;

    public GetAmenityBookingByIdQueryHandler(ITenantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<AmenityBookingDto>> Handle(
        GetAmenityBookingByIdQuery request,
        CancellationToken cancellationToken)
    {
        var booking = await _dbContext.AmenityBookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.IsActive, cancellationToken);

        if (booking == null)
        {
            return Result<AmenityBookingDto>.Failure($"Booking with ID '{request.Id}' not found.");
        }

        // Get related data
        var amenity = await _dbContext.Amenities
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == booking.AmenityId, cancellationToken);

        var unit = await _dbContext.Units
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == booking.UnitId, cancellationToken);

        string? blockName = null;
        if (unit != null)
        {
            blockName = await _dbContext.Blocks
                .AsNoTracking()
                .Where(b => b.Id == unit.BlockId)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Get user names
        async Task<string?> GetUserName(Guid? userId)
        {
            if (!userId.HasValue) return null;
            var partyId = await _dbContext.CommunityUsers
                .AsNoTracking()
                .Where(cu => cu.Id == userId.Value)
                .Select(cu => cu.PartyId)
                .FirstOrDefaultAsync(cancellationToken);

            if (partyId == Guid.Empty) return null;

            return await _dbContext.Parties
                .AsNoTracking()
                .Where(p => p.Id == partyId)
                .Select(p => p.PartyName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var bookedForUserName = await GetUserName(booking.BookedForUserId);
        var approvedByUserName = await GetUserName(booking.ApprovedByUserId);
        var rejectedByUserName = await GetUserName(booking.RejectedByUserId);
        var cancelledByUserName = await GetUserName(booking.CancelledByUserId);

        var dto = new AmenityBookingDto
        {
            Id = booking.Id,
            AmenityId = booking.AmenityId,
            AmenityName = amenity?.Name ?? string.Empty,
            UnitId = booking.UnitId,
            UnitNumber = unit?.UnitNumber ?? string.Empty,
            BlockName = blockName,
            BookedForUserId = booking.BookedForUserId,
            BookedForUserName = bookedForUserName ?? string.Empty,
            StartAt = booking.StartAt,
            EndAt = booking.EndAt,
            Status = booking.Status,
            Source = booking.Source,
            Title = booking.Title,
            Notes = booking.Notes,
            AdminNotes = booking.AdminNotes,
            NumberOfGuests = booking.NumberOfGuests,
            ApprovedAt = booking.ApprovedAt,
            ApprovedByUserId = booking.ApprovedByUserId,
            ApprovedByUserName = approvedByUserName,
            RejectedAt = booking.RejectedAt,
            RejectedByUserId = booking.RejectedByUserId,
            RejectedByUserName = rejectedByUserName,
            RejectionReason = booking.RejectionReason,
            CancelledAt = booking.CancelledAt,
            CancelledByUserId = booking.CancelledByUserId,
            CancelledByUserName = cancelledByUserName,
            CancellationReason = booking.CancellationReason,
            CompletedAt = booking.CompletedAt,
            DepositRequired = booking.DepositRequired,
            DepositAmount = booking.DepositAmount,
            DepositStatus = booking.DepositStatus,
            DepositReference = booking.DepositReference,
            IsActive = booking.IsActive,
            CreatedAt = booking.CreatedAt
        };

        return Result<AmenityBookingDto>.Success(dto);
    }
}
