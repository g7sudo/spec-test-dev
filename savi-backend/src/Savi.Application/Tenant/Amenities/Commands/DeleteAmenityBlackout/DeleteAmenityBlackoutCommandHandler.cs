using MediatR;
using Microsoft.EntityFrameworkCore;
using Savi.Application.Common.Interfaces;
using Savi.SharedKernel.Common;
using Savi.SharedKernel.Interfaces;

namespace Savi.Application.Tenant.Amenities.Commands.DeleteAmenityBlackout;

/// <summary>
/// Handler for deleting (soft delete) an amenity blackout period.
/// </summary>
public class DeleteAmenityBlackoutCommandHandler
    : IRequestHandler<DeleteAmenityBlackoutCommand, Result<bool>>
{
    private readonly ITenantDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public DeleteAmenityBlackoutCommandHandler(
        ITenantDbContext dbContext,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> Handle(
        DeleteAmenityBlackoutCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.TenantUserId.HasValue)
        {
            return Result<bool>.Failure("User does not exist in the current tenant.");
        }

        var blackout = await _dbContext.AmenityBlackouts
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.IsActive, cancellationToken);

        if (blackout == null)
        {
            return Result<bool>.Failure($"Blackout with ID '{request.Id}' not found.");
        }

        // Soft delete using the Deactivate method from BaseEntity
        blackout.Deactivate(_currentUser.TenantUserId.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
