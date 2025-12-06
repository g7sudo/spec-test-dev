using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.Domain.Tenant.Enums;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.UpdateDepositStatus;

/// <summary>
/// Handler for updating deposit status of an amenity booking.
/// </summary>
public class UpdateDepositStatusCommandHandler
    : IRequestHandler<UpdateDepositStatusCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateDepositStatusCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        UpdateDepositStatusCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure("User does not exist in the current tenant.");
        }

        var booking = await _dbContext.AmenityBookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.IsActive, cancellationToken);

        if (booking == null)
        {
            return Result<bool>.Failure($"Booking with ID '{request.BookingId}' not found.");
        }

        if (!booking.DepositRequired)
        {
            return Result<bool>.Failure("This booking does not require a deposit.");
        }

        switch (request.NewStatus)
        {
            case AmenityDepositStatus.Paid:
                booking.MarkDepositPaid(request.Reference, _currentUser.TenantUserId.Value);
                break;

            case AmenityDepositStatus.Refunded:
                booking.RefundDeposit(_currentUser.TenantUserId.Value);
                break;

            case AmenityDepositStatus.Forfeited:
                booking.ForfeitDeposit(_currentUser.TenantUserId.Value);
                break;

            default:
                return Result<bool>.Failure($"Cannot transition deposit to status '{request.NewStatus}'.");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
